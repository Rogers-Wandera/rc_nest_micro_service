import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NotificationResendMeta } from 'src/entities/core/notificationresendmeta.entity';
import { EntityDataSource } from 'src/model/enity.data.model';
import { EntityModel } from 'src/model/entity.model';

@Injectable()
export class NotificationResendMetaService extends EntityModel<NotificationResendMeta> {
  constructor(datasource: EntityDataSource) {
    super(NotificationResendMeta, datasource);
  }

  async CreateMeta(meta?: Record<string, string | number | Date | Boolean>) {
    try {
      if (meta) {
        this.entity.createdBy = 'system';
        this.entity.updatedBy = 'system';
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
