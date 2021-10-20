import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
import { AccountRequest } from 'salesloft/dist/resources/Accounts';
import { PersonRequest } from 'salesloft/dist/resources/People';
import { CallRequest } from 'salesloft/dist/resources/Calls';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.requestId}${this.idMap.scenarioId}${this.idMap.requestorId}Salesloft`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Account aware methods
  // -------------------------------------------------------------------

  public async findAccountByDomain(domainName: string) {
    const cachekey = `${this.cachePrefix}Account${domainName}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findAccountByDomain(domainName);
      if (result && result.length) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createAccount(account: AccountRequest) {
    const domainName = account['domain'];
    await this.delCache(`${this.cachePrefix}Account${domainName}`);
    return await this.client.createAccount(account);
  }

  public async updateAccount(id: number, account: AccountRequest) {
    const domainName = account['domain'];
    await this.delCache(`${this.cachePrefix}Account${domainName}`);
    return this.client.updateAccount(id, account);
  }

  public async deleteAccount(id: number, domainName: string) {
    await this.delCache(`${this.cachePrefix}Account${domainName}`);
    return this.client.deleteAccount(id);
  }

  // Person aware methods
  // -------------------------------------------------------------------

  public async findPersonByEmail(email: string) {
    const cachekey = `${this.cachePrefix}Person${email}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findPersonByEmail(email);
      if (result && result.length) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async createPerson(person: PersonRequest) {
    const email = person['email_address'];
    await this.delCache(`${this.cachePrefix}Person${email}`);
    return await this.client.createPerson(person);
  }

  public async updatePerson(id: number, person: PersonRequest) {
    const email = person['email_address'];
    await this.delCache(`${this.cachePrefix}Person${email}`);
    return this.client.updatePerson(id, person);
  }

  public async deletePerson(id: number, email: string) {
    await this.delCache(`${this.cachePrefix}Person${email}`);
    return this.client.deletePerson(id);
  }

  // all non-cached methods, just referencing the original function
  // -------------------------------------------------------------------

  public async createCall(call: CallRequest) {
    return await this.client.createCall(call);
  }

  public async getAllCrmActivites() {
    return await this.client.getAllCrmActivites();
  }

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      await this.setAsync(key, 600, JSON.stringify(value));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }
}
​
export { CachingClientWrapper as CachingClientWrapper };
