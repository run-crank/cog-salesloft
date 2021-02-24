import * as salesloft from 'salesloft';
import { AccountRequest } from 'salesloft/dist/resources/Accounts';

export class AccountAwareMixin {
  client: salesloft.SalesLoft;

  public async findAccountByDomain(domainName: string) {
    return this.client.Accounts.list({
      domain: domainName,
    });
  }

  public async createAccount(account: AccountRequest) {
    return this.client.Accounts.create(account);
  }

  public async updateAccount(id: number, account: AccountRequest) {
    return this.client.Accounts.update(id, account);
  }

  public async deleteAccount(id: number) {
    return this.client.Accounts.delete(id);
  }
}
