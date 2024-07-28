import { RpcException } from '@nestjs/microservices';
import { MODEL_CLASS_KEY } from 'src/app/decorators/model.decorators';
import { EntityModel } from 'src/model/entity.model';
import { Model } from 'src/model/model';

export class ModelService {
  constructor(protected modelInstance: Model) {}
  protected getCallerInfo<T>(caller: T) {
    const EntityModelPrototype = EntityModel.prototype;
    let isEntityModelPrototype = false;
    if (Object.prototype.isPrototypeOf.call(EntityModelPrototype, caller)) {
      isEntityModelPrototype = true;
    }
    const metadata = Reflect.getMetadata(MODEL_CLASS_KEY, caller);
    return {
      className: caller.constructor.name,
      isEntityModel: isEntityModelPrototype,
      metadata: metadata,
    };
  }

  public async initialize(): Promise<void> {
    await this.modelInstance.initialize();
  }
  public getModel<T>(caller: T | 'pass'): Model {
    try {
      if (caller === 'pass') {
        return this.modelInstance;
      }
      const data = this.getCallerInfo(caller);
      if (data.isEntityModel && data.metadata) {
        return this.modelInstance;
      }
      throw new RpcException(
        `Direct calls to the model are not allowed, only call model in the entity class, check class ${data.className}`,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  public async close() {
    await this.modelInstance.destroy();
  }
}
