import { DataSourceOptions, EntityTarget, ObjectLiteral } from 'typeorm';
import { MainDBBuilder } from './mainbuilder';
import {
  PaginationResults,
  customquerypaginateprops,
  paginateprops,
} from './conntypes';
import { format } from 'date-fns';
import { RpcException } from '@nestjs/microservices';

export class DataExtenderBuilder extends MainDBBuilder {
  constructor(options: DataSourceOptions) {
    super(options);
  }
  async findPaginate<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    data: paginateprops<T>,
  ): Promise<PaginationResults<T>> {
    try {
      if (Object.keys(data).length <= 0) {
        throw new RpcException('Pagination should be provided');
      }
      const page = data.page > 0 ? data.page : 1;
      const repository = this.getRepository(entity);
      const queryBuilder = repository.createQueryBuilder('entity');
      if (data?.conditions) {
        Object.entries(data.conditions).forEach(([key, value]) => {
          queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
        });
      }

      //   global filter
      if (data?.globalFilter) {
        const columns = repository.metadata.columns.map(
          (col) => col.propertyName,
        );
        const globalFilterConditions = columns
          .map((column) => `entity.${column} LIKE :globalFilter`)
          .join(' OR ');
        queryBuilder.andWhere(`(${globalFilterConditions})`, {
          globalFilter: `%${data.globalFilter}%`,
        });
      }

      //   filters
      if (data.filters?.length > 0) {
        data.filters.forEach((filter) => {
          const value = filter.id.toString().toLowerCase().includes('date')
            ? `%${format(new Date(filter.value), 'yyyy-MM-dd')}%`
            : `%${filter.value}%`;
          queryBuilder.andWhere(
            `entity.${filter.id.toString()} LIKE :${filter.id.toString()}`,
            { [filter.id]: value },
          );
        });
      }

      //   add sorting
      if (data?.sortBy.length > 0) {
        const sort = data.sortBy[0].id;
        const sortOrder = data.sortBy[0].desc ? 'DESC' : 'ASC';
        queryBuilder.orderBy(`entity.${String(sort)}`, sortOrder);
      }

      //   add pagination
      queryBuilder.skip((page - 1) * data.limit).take(data.limit);
      const [docs, totalDocs] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(totalDocs / data.limit);
      return {
        docs,
        totalDocs,
        totalPages,
        page: data.page,
      };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async customQueryPaginate<T extends ObjectLiteral>(
    data: customquerypaginateprops<T>,
  ): Promise<PaginationResults<T>> {
    try {
      const { query, queryParams, limit, page, sortBy, globalFilter, filters } =
        data;

      let sql = query.trim();
      const queryValues = [...queryParams];
      if (sql.trim().endsWith(';')) {
        sql = sql.trim().slice(0, -1);
      }

      const whereClauses: string[] = [];
      const whereValues: string[] = [];

      const whereIndex = sql.toUpperCase().indexOf('WHERE');
      if (whereIndex !== -1) {
        const existingWhereClause = sql.substring(whereIndex + 5).trim();
        whereClauses.push(existingWhereClause);
      }

      if (globalFilter) {
        const columns = await this.getColumns(query, queryParams);
        const globalSearchClauses = columns
          .map((column) => `${column} LIKE ?`)
          .join(' OR ');

        whereClauses.push(`${globalSearchClauses}`);
        whereValues.push(...Array(columns.length).fill(`%${globalFilter}%`));
      }

      if (filters.length > 0) {
        filters.forEach((filter) => {
          whereClauses.push(`${String(filter.id)} LIKE ?`);
          whereValues.push(`%${filter.value}%`);
        });
      }

      // Reconstruct the SQL query with WHERE clauses
      if (whereClauses.length > 0) {
        const whereClause = whereClauses.join(' AND ');
        if (whereIndex !== -1) {
          sql = `${sql.substring(0, whereIndex)} WHERE ${whereClause}`;
        } else {
          sql += ` WHERE ${whereClause}`;
        }
        queryValues.push(...whereValues);
      }

      // apply sorting
      if (sortBy.length > 0) {
        const sortClauses = sortBy.map(
          (sort) => `${String(sort.id)} ${sort.desc ? 'DESC' : 'ASC'}`,
        );
        sql += ` ORDER BY ${sortClauses.join(', ')}`;
      }

      // Apply pagination
      sql += ` LIMIT ? OFFSET ?`;
      queryValues.push(limit, (page - 1) * limit);

      const [docs, totalDocs] = await Promise.all([
        this.query(sql, queryValues),
        this.getTotalDocs(sql, queryValues),
      ]);
      const totalPages = Math.ceil(totalDocs / limit);
      return {
        docs,
        totalDocs,
        totalPages,
        page: data.page,
      };
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
