import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
import { AccountRequest } from 'salesloft/dist/resources/Accounts';
import { PersonRequest } from 'salesloft/dist/resources/People';
import { CallRequest } from 'salesloft/dist/resources/Calls';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}${this.idMap.connectionId}`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Account aware methods
  // -------------------------------------------------------------------

  public async findAccountByDomain(domainName: string) {
    const cachekey = `Salesloft|Account|${domainName}|${this.cachePrefix}`;
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
    await this.clearCache();
    return await this.client.createAccount(account);
  }

  public async updateAccount(id: number, account: AccountRequest) {
    await this.clearCache();
    return this.client.updateAccount(id, account);
  }

  public async deleteAccount(id: number, domainName: string = null) {
    await this.clearCache();
    return this.client.deleteAccount(id);
  }

  // Person aware methods
  // -------------------------------------------------------------------

  public async findPersonByEmail(email: string) {
    const cachekey = `Salesloft|Person|${email}|${this.cachePrefix}`;
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
    await this.clearCache();
    return await this.client.createPerson(person);
  }

  public async updatePerson(id: number, person: PersonRequest) {
    await this.clearCache();
    return this.client.updatePerson(id, person);
  }

  public async deletePerson(id: number, email: string = null) {
    await this.clearCache();
    return this.client.deletePerson(id);
  }

  // Call aware methods
  // -------------------------------------------------------------------

  public async createCall(call: CallRequest) {
    await this.clearCache();
    return await this.client.createCall(call);
  }

  // all non-cached methods, just referencing the original function
  // -------------------------------------------------------------------

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
      // arrOfKeys will store an array of all cache keys used in this scenario run, so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
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

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }
}
​
export { CachingClientWrapper as CachingClientWrapper };
