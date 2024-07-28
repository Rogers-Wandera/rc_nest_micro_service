import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Injectable } from '@nestjs/common';
import Admin from 'firebase-admin';

@Injectable()
export class FireBaseService {
  public app: FirebaseApp;
  public admin: Admin.app.App;
  constructor(
    options: FirebaseOptions,
    private readonly serviceAccount: Admin.ServiceAccount,
  ) {
    this.app = initializeApp(options);
    this.admin = Admin.initializeApp({
      credential: Admin.credential.cert(this.serviceAccount),
    });
  }
}
