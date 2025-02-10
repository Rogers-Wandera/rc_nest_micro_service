import { Injectable } from '@nestjs/common';
import {
  InjectIoClientProvider,
  IoClient,
  OnConnect,
  OnConnectError,
  EventListener,
  OnDisconnect,
} from 'nestjs-io-client';

@Injectable()
export class EventGatewayService {
  constructor(
    @InjectIoClientProvider()
    private readonly io: IoClient,
  ) {}
  @OnConnect()
  connect() {
    console.log('socket connected to the server', `[${this.io.connected}]`);
    this.io.emit('connected_back', { message: 'connected' });
  }

  @OnConnectError()
  connectError(err: Error) {
    console.error(`An error occurs: ${err}`);
  }
  @OnDisconnect()
  disconnect(reason: IoClient.DisconnectReason) {
    console.log('disconnected from the server', `Reason: [${reason}]`);
  }
  @EventListener('AuthError')
  AuthErrorHandler(data: { message: string }) {
    console.log('Connection has been refused', `Reason: [${data.message}]`);
  }
}
