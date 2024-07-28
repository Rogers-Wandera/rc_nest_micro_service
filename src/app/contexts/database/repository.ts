import {
  BaseEntity,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  QueryRunner,
  Repository,
} from 'typeorm';

export class MyRepository<T> extends Repository<T> {
  constructor(
    target: EntityTarget<T>,
    manager: EntityManager,
    queryRunner?: QueryRunner,
  ) {
    super(target, manager, queryRunner);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    await validateWhereOptions(options?.where);
    return super.count(options);
  }
  async countBy(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<number> {
    await validateWhereOptions(where);
    return super.countBy(where);
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    await validateWhereOptions(options?.where);
    return super.find(options);
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    await validateWhereOptions(options?.where);
    return super.findAndCount(options);
  }

  async findBy(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<T[]> {
    await validateWhereOptions(where);
    return super.findBy(where);
  }

  async findAndCountBy(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<[T[], number]> {
    await validateWhereOptions(where);
    return super.findAndCountBy(where);
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    await validateWhereOptions(options?.where);
    return super.findOne(options);
  }
  async findOneBy(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<T> {
    await validateWhereOptions(where);
    return super.findOneBy(where);
  }
  async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
    await validateWhereOptions(options?.where);
    return super.findOneOrFail(options);
  }

  async findOneByOrFail(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<T> {
    await validateWhereOptions(where);
    return super.findOneByOrFail(where);
  }
  async existsBy(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): Promise<boolean> {
    await validateWhereOptions(where);
    return super.existsBy(where);
  }

  async exists(options?: FindManyOptions<T>): Promise<boolean> {
    await validateWhereOptions(options?.where);
    return super.exists(options);
  }
}

export function validateWhereOptions(
  where?: FindOptionsWhere<BaseEntity>[] | FindOptionsWhere<BaseEntity>,
): Promise<void> {
  if (!where) {
    return Promise.resolve();
  }

  if (!Array.isArray(where)) {
    where = [where];
  }
  const errors: string[] = [];
  where.forEach((findOptionsWhere) => {
    for (const key in findOptionsWhere) {
      if (
        findOptionsWhere[key] === null ||
        findOptionsWhere[key] === undefined
      ) {
        errors.push(`Invalid value of where parameter ${key}`);
      }
    }
  });

  if (errors.length) {
    return Promise.reject(errors.join('. '));
  }

  return Promise.resolve();
}
