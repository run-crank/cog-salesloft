import * as grpc from 'grpc';
import * as salesloft from 'salesloft';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { PersonAwareMixin, AccountAwareMixin } from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'apiKey',
    type: FieldDefinition.Type.STRING,
    description: 'API Key',
  }];

  public client: salesloft.SalesLoft;

  constructor(auth: grpc.Metadata, clientConstructor = salesloft.SalesLoft) {
    this.client = new clientConstructor(auth.get('apiKey').toString());
  }
}

interface ClientWrapper extends PersonAwareMixin, AccountAwareMixin {}
applyMixins(ClientWrapper, [PersonAwareMixin, AccountAwareMixin]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
          // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
