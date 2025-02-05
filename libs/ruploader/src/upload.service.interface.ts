import { Observable } from 'rxjs';
import { RUpload_Observable_Return } from './configs/upload_options';

export interface I_RUpload {
  singleUpload(
    file: Express.Multer.File,
  ): Observable<RUpload_Observable_Return>;
  multipleUploads(
    files: Express.Multer.File[],
  ): Observable<RUpload_Observable_Return[]>;
}
