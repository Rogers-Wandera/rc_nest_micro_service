import { Inject, Injectable } from '@nestjs/common';
import { RUPLOADER_TYPE } from '@rupload/ruploader/configs/upload_enums';
import {
  RConfigOptions,
  RUpload_Observable_Return,
} from '@rupload/ruploader/configs/upload_options';
import { I_RUpload } from '@rupload/ruploader/upload.service.interface';
import { v2 as cloudinary } from 'cloudinary';
import { createReadStream } from 'fs';
import { IoClient } from 'nestjs-io-client';
import { forkJoin, map, Observable } from 'rxjs';

@Injectable()
export class CloudinaryService implements I_RUpload {
  public options: RConfigOptions | null = null;
  public socket: IoClient | null = null;
  constructor(
    @Inject('R_UPLOAD_CONFIG_OPTIONS') private config: RConfigOptions,
  ) {
    if (this.config.type === RUPLOADER_TYPE.CLOUDINARY) {
      cloudinary.config(this.config.options);
    }
  }
  multipleUploads(
    files: Express.Multer.File[],
    meta?: Record<string, any>,
  ): Observable<RUpload_Observable_Return[]> {
    const observables = files.map((file) =>
      this.singleUpload(file, meta).pipe(map((result) => ({ ...result }))),
    );
    return forkJoin(observables);
  }

  singleUpload(
    file: Express.Multer.File,
    meta?: Record<string, any>,
  ): Observable<RUpload_Observable_Return> {
    if (!this.options) {
      throw new Error('Please provide cloudinary upload options');
    }
    if (this.options.type !== RUPLOADER_TYPE.CLOUDINARY) {
      throw new Error('Please provide cloudinary upload options');
    }
    const resourceType =
      file.mimetype.split('/')[0] === 'image' ? 'image' : 'raw';
    let options = this.options.options;
    options = { ...this.options.options, resource_type: resourceType };
    return new Observable((observer) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            observer.error({
              error: `Cloudinary error: ${error.message}`,
              filename: meta?.type || file.filename,
              meta: meta,
            });
          } else {
            observer.next({
              progress: 100,
              data: {
                type: RUPLOADER_TYPE.CLOUDINARY,
                publicUrl: result.url,
                meta,
                results: result,
                filename: meta?.type || file.filename,
              },
            });
            observer.complete();
            if (this.options?.callback) {
              this.options.callback({
                type: RUPLOADER_TYPE.CLOUDINARY,
                publicUrl: result.url,
                meta,
                results: result,
                filename: meta?.type || file.filename,
              });
            }
            if (this.socket) {
              const pattern = this?.options?.pattern
                ? this.options.pattern
                : 'upload_complete';
              this.socket.emit(pattern, {
                progress: 100,
                data: {
                  type: RUPLOADER_TYPE.CLOUDINARY,
                  publicUrl: result.url,
                  meta,
                  results: result,
                  filename: meta?.type || file.filename,
                },
              });
            }
          }
        },
      );
      const fileStream = createReadStream(file.path);
      let uploadedBytes = 0;
      fileStream.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        const progress = Math.round((uploadedBytes / file.size) * 100);

        observer.next({ progress, filename: meta?.type || file.filename });
      });
      fileStream.pipe(stream);
    });
  }
}
