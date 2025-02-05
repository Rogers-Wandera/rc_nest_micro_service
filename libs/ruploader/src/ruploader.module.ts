import { DynamicModule, Global, Module } from '@nestjs/common';
import { RuploaderService } from './ruploader.service';
import { RConfigOptions } from './configs/upload_options';
import { CloudinaryService } from './conn/clodinary/cloudinary';

@Global()
@Module({})
export class RuploaderModule {
  static forRoot(options: RConfigOptions): DynamicModule {
    return {
      module: RuploaderModule,
      providers: [
        { provide: 'R_UPLOAD_CONFIG_OPTIONS', useValue: options },
        RuploaderService,
        CloudinaryService,
      ],
      exports: [RuploaderService],
    };
  }
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<RConfigOptions> | RConfigOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: RuploaderModule,
      imports: options?.imports || [],
      providers: [
        {
          provide: 'R_UPLOAD_CONFIG_OPTIONS',
          useFactory: options.useFactory,
          inject: options?.inject || [],
        },
        RuploaderService,
        CloudinaryService,
      ],
      exports: [RuploaderService],
    };
  }
}
