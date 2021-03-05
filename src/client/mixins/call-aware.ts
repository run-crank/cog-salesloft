import * as salesloft from 'salesloft';
import { CallRequest } from 'salesloft/dist/resources/Calls';

export class CallAwareMixin {
  client: salesloft.SalesLoft;

  public async createCall(call: CallRequest) {
    return this.client.Calls.create(call);
  }
}
