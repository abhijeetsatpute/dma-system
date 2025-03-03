import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { result: string } {
    return { result: 'Hello World!' };
  }
}
