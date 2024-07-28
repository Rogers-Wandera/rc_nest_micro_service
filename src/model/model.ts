import { DataSourceOptions, ObjectLiteral } from 'typeorm';
import { Request } from 'express';
import { DataExtenderBuilder } from 'src/app/contexts/database/extenderbuilder';
import {
  customquerypaginateprops,
  PaginationResults,
} from 'src/app/contexts/database/conntypes';

export class Model extends DataExtenderBuilder {
  constructor(options: DataSourceOptions) {
    super(options);
  }
  public setRequest(request: Request) {
    this.request = request;
  }
  public async __viewCustomPaginateData<R extends ObjectLiteral>(
    paginateprops: customquerypaginateprops<R>,
  ): Promise<PaginationResults<R>> {
    try {
      const data = await this.customQueryPaginate(paginateprops);
      return data;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
