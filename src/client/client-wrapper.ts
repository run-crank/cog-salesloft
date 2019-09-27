import * as grpc from 'grpc';
import * as salesloft from 'salesloft';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import { PersonRequest } from 'salesloft/dist/resources/People';

export class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'apiKey',
    type: FieldDefinition.Type.STRING,
    description: 'API Key',
  }];

  private client: salesloft.SalesLoft;

  constructor(auth: grpc.Metadata, clientConstructor = salesloft.SalesLoft) {
    this.client = new clientConstructor(auth.get('apiKey').toString());
  }

  public async findPersonByEmail(email: string) {
    return this.client.People.list({
      email_addresses: [email],
    });
  }

  public async createPerson(person: PersonRequest) {
    return this.client.People.create(person);
  }

  public async updatePerson(id: number, person: PersonRequest) {
    return this.client.People.update(id, person);
  }

  public async deletePerson(id: number) {
    return this.client.People.delete(id);
  }
}
