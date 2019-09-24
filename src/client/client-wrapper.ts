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

  public async getPersonByEmail(email: string): Promise<PersonRequest> {
    return new Promise((resolve, reject) => {
      this.client.People.list({
        email_addresses: [email],
      }).then((person) => {
        if (!person[0]) {
          reject('Person not found');
        }

        resolve(person[0]);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  public async createOrUpdatePerson(person: PersonRequest): Promise<Object> {
    return new Promise(async (resolve, reject) => {

      try {
        const existingPerson: PersonRequest = await this.getPersonByEmail(person['email_address']);

        this.client.People.update(existingPerson['id'], existingPerson).then((response) => {
          resolve(response);
        }).catch((error) => {
          reject(error);
        });
      } catch (e) {
        if (e === 'Person not found') {
          this.client.People.create(person).then((response) => {
            resolve(response);
          }).catch((error) => {
            reject(error);
          });
        }
      }

    });
  }

  public async deletePersonByEmail(email: string): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const person = await this.getPersonByEmail(email);
        this.client.People.delete(person['id']).then((response) => {
          resolve(response);
        }).catch((error) => {
          reject(error);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
