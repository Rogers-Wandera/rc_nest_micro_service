import {
  DataSource,
  DataSourceOptions,
  EntityMetadata,
  EntityTarget,
  ObjectLiteral,
} from 'typeorm';
import { CustomRepository, repositoryextender } from './customrepository';
import { Request } from 'express';
import { RpcException } from '@nestjs/microservices';

export class MainDBBuilder extends DataSource {
  protected request: Request = undefined;
  constructor(options: DataSourceOptions) {
    super(options);
  }

  getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
  ): CustomRepository<T> {
    const baseRepository = super.getRepository(entity);
    const extendedRepository = repositoryextender(entity, this.manager);
    return Object.assign(
      baseRepository,
      extendedRepository,
    ) as CustomRepository<T>;
  }
  async getColumns<T extends ObjectLiteral>(
    query: string,
    queryParams: (string | number)[],
  ): Promise<string[]> {
    const result: T[] = await this.query(query, queryParams);
    return Object.keys(result[0] || []);
  }

  async getTotalDocs(
    query: string,
    queryValues: (string | number)[],
  ): Promise<number> {
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as countQuery`;
    const result = await this.query(countQuery, queryValues);
    return parseInt(result[0].total, 10);
  }

  async getColumnsQuery<T>(entity: EntityTarget<T>): Promise<string[]> {
    try {
      const repository = this.getRepository(entity);
      const metadata: EntityMetadata = repository.metadata;
      const columns: string[] = metadata.columns.map((col) => col.propertyName);
      return columns;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  async executeQuery<T extends ObjectLiteral>(
    query: string,
    params?: (string | number)[],
  ): Promise<T[]> {
    try {
      const response = await this.query<T[]>(query, params);
      return response;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
