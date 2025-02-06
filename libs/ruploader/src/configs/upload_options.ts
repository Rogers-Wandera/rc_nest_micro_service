import { UploadApiOptions, ConfigOptions } from 'cloudinary';
import { RUPLOADER_TYPE } from './upload_enums';

export interface CloudinaryUploadOptions {
  type: RUPLOADER_TYPE.CLOUDINARY;
  options: UploadApiOptions;
}

export interface FireStoreConfigOptions {
  type: RUPLOADER_TYPE.FIRE_STORE;
  options: {};
}

export interface CloudinaryConfigOptions {
  type: RUPLOADER_TYPE.CLOUDINARY;
  options: ConfigOptions;
}

export interface RUploadReturn {
  type: RUPLOADER_TYPE;
  publicUrl: string;
  meta?: Record<string, any>;
  results?: any;
  filename: string;
}

export type RUploadOptions = CloudinaryUploadOptions & {
  files: Express.Multer.File[];
  meta?: Record<string, any>;
  pattern?: string;
};
export type RConfigOptions = (
  | CloudinaryConfigOptions
  | FireStoreConfigOptions
) & {
  pattern?: string;
};

export type RUpload_Observable_Return = {
  progress: number;
  data?: RUploadReturn;
  filename?: string;
};
