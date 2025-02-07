import { Injectable } from '@nestjs/common';
import { RUploadOptions, RUploadReturn } from './configs/upload_options';
import { RUPLOADER_TYPE } from './configs/upload_enums';
import { CloudinaryService } from './conn/clodinary/cloudinary';
import { IoClient } from 'nestjs-io-client';

@Injectable()
export class RuploaderService {
  public socket?: IoClient;
  public successCallBack: (results: RUploadReturn) => void = () => {};
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  upload(uploadoptions: RUploadOptions) {
    if (!uploadoptions?.options) {
      throw new Error(
        'Please include uploadoptions for ' + uploadoptions?.type,
      );
    }
    if (uploadoptions?.files?.length <= 0) {
      throw new Error('Please include files for ' + uploadoptions?.type);
    }
    switch (uploadoptions.type) {
      case RUPLOADER_TYPE.CLOUDINARY:
        this.cloudinaryService.options = uploadoptions;
        this.cloudinaryService.socket = this.socket;
        this.cloudinaryService.options['callback'] = this.successCallBack;
        // Type guard to handle multiple vs single uploads
        if (uploadoptions?.files && uploadoptions?.files?.length > 1) {
          // return this.cloudinaryService.multipleUploads(
          //   uploadoptions.files,
          //   uploadoptions?.meta,
          // );
          throw new Error('Multiple uploads not supported yet');
        } else if (uploadoptions?.files && uploadoptions?.files?.length === 1) {
          return this.cloudinaryService.singleUpload(
            uploadoptions.files[0],
            uploadoptions?.meta,
          );
        } else {
          throw new Error('Please include files for ' + uploadoptions?.type);
        }
      default: {
        throw new Error('No uploader type found');
      }
    }
  }
}
