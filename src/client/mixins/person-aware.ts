import * as salesloft from 'salesloft';
import { PersonRequest } from 'salesloft/dist/resources/People';

export class PersonAwareMixin {
  client: salesloft.SalesLoft;

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
