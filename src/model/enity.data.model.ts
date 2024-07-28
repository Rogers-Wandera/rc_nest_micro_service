import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DatabaseService } from 'src/db/database.provider';
import { EntityTarget, Repository } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class EntityDataSource {
  public model: DatabaseService;
  public request: Request;
  constructor(
    @Inject('data_source') model: DatabaseService,
    @Inject(REQUEST) request: Request,
  ) {
    this.request = request;
    this.model = model;
  }
  public getRepository<T>(entity: EntityTarget<T>): Repository<T> {
    return this.model.GetRepository(entity);
  }
}
