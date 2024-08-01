import { Injectable, Scope } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NotificationMeta } from 'src/entities/core/notificationmeta.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';

@Injectable({ scope: Scope.TRANSIENT })
export class NotificationMetaService extends EntityModel<NotificationMeta> {
  constructor(datasource: EntityDataSource) {
    super(NotificationMeta, datasource);
  }

  async CreateMeta(meta?: Record<string, string | number | Date | Boolean>) {
    try {
      if (meta) {
        this.entity.updatedBy = this.entity.createdBy;
        for (const key in meta) {
          this.entity.value = meta[key];
          this.entity.name = key;
          const entity = this.repository.create(this.entity);
          await this.repository.save(entity);
        }
      }
      return true;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
