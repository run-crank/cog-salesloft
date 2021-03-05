import * as salesloft from 'salesloft';

export class CrmActivityAwareMixin {
  client: salesloft.SalesLoft;

  public async getAllCrmActivites() {
    return this.client.CRMActivities.list();
  }
}
