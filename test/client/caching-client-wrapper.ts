import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { CachingClientWrapper } from '../../src/client/caching-client-wrapper';
import { PersonRequest } from 'salesloft/dist/resources/People';
import { AccountRequest } from 'salesloft/dist/resources/Accounts';
import { CallRequest } from 'salesloft/dist/resources/Calls';

chai.use(sinonChai);

describe('CachingClientWrapper', () => {
  const expect = chai.expect;
  let cachingClientWrapperUnderTest: CachingClientWrapper;
  let personRequest: PersonRequest;
  let accountRequest: AccountRequest;
  let callRequest: CallRequest;
  let clientWrapperStub: any;
  let redisClientStub: any;
  let idMap: any;

  beforeEach(() => {
    clientWrapperStub = {
      findAccountByDomain: sinon.spy(),
      createAccount: sinon.spy(),
      updateAccount: sinon.spy(),
      deleteAccount: sinon.spy(),
      findPersonByEmail: sinon.spy(),
      createPerson: sinon.spy(),
      updatePerson: sinon.spy(),
      deletePerson: sinon.spy(),
      createCall: sinon.spy(),
      getAllCrmActivites: sinon.spy(),
    };

    redisClientStub = {
      get: sinon.spy(),
      setex: sinon.spy(),
      del: sinon.spy(),
    };

    idMap = {
      requestId: '1',
      scenarioId: '2',
      requestorId: '3',
    };
  });

  it('findPersonByEmail using original function', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findPersonByEmail(expectedEmail);

    setTimeout(() => {
      expect(clientWrapperStub.findPersonByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('findPersonByEmail using cache', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findPersonByEmail(expectedEmail);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findPersonByEmail).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deletePerson', (done) => {
    const expectedEmail = 'test@example.com';
    const expectedId = 123;
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deletePerson(expectedId, expectedEmail);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deletePerson).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('createPerson', (done) => {
    personRequest = {
      email_address: 'gene@thisisjust.atomatest.com',
      first_name: 'Gene',
      last_name: 'Freecs',
      person_company_name: 'Automaton',
      state: 'SC'
    }
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createPerson(personRequest);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createPerson).to.have.been.calledWith(personRequest);
      done();
    });
  });

  it('updatePerson', (done) => {
    personRequest = {
      email_address: 'gene@thisisjust.atomatest.com',
      first_name: 'Gene',
      last_name: 'Freecs',
      person_company_name: 'Automaton',
      state: 'SC'
    }
    const expectedId = 123;
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.updatePerson(expectedId, personRequest);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.updatePerson).to.have.been.calledWith(expectedId, personRequest);
      done();
    });
  });

  it('findAccountByDomain using original function', (done) => {
    const expectedDomain = 'example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findAccountByDomain(expectedDomain);

    setTimeout(() => {
      expect(clientWrapperStub.findAccountByDomain).to.have.been.calledWith(expectedDomain);
      done();
    });
  });

  it('findAccountByDomain using cache', (done) => {
    const expectedDomain = 'example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findAccountByDomain(expectedDomain);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findAccountByDomain).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deleteAccount', (done) => {
    const expectedId = 123;
    const expectedDomain = 'example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteAccount(expectedId, expectedDomain);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteAccount).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('createAccount', (done) => {
    accountRequest = {
      city: 'Gary',
      country: 'USA',
      domain: 'thisisatest.com',
      name: 'Gene Freecs',
      state: 'Indiana'
    }
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createAccount(accountRequest);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createAccount).to.have.been.calledWith(accountRequest);
      done();
    });
  });

  it('updateAccount', (done) => {
    accountRequest = {
      city: 'Gary',
      country: 'USA',
      domain: 'thisisatest.com',
      name: 'Gene Freecs',
      state: 'Indiana'
    }
    const expectedId = 123;
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.updateAccount(expectedId, accountRequest);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.updateAccount).to.have.been.calledWith(expectedId, accountRequest);
      done();
    });
  });

  it('createCall using original function', (done) => {
    callRequest = {
      person_id: 401251038,
      sentiment: 'Customer',
      disposition: 'Connected',
      notes: 'This is a test note',
      crm_params: {}
    };
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createCall(callRequest);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createCall).to.have.been.calledWith(callRequest);
      done();
    });
  });

  it('getAllCrmActivites using original function', (done) => {
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAllCrmActivites();

    setTimeout(() => {
      expect(clientWrapperStub.getAllCrmActivites).to.have.been.called;
      done();
    });
  });

  it('getCache', (done) => {
    redisClientStub.get = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.get).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('setCache', (done) => {
    redisClientStub.setex = sinon.stub().yields(); 
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(null);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.setCache('expectedKey', 'expectedValue');

    setTimeout(() => {
      expect(redisClientStub.setex).to.have.been.calledWith('expectedKey', 600, '"expectedValue"');
      expect(redisClientStub.setex).to.have.been.calledWith('cachekeys|testPrefix', 600, '["expectedKey"]');
      done();
    });
  });

  it('delCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.delCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('clearCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(['testKey1', 'testKey2'])
    cachingClientWrapperUnderTest.clearCache();

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('testKey1');
      expect(redisClientStub.del).to.have.been.calledWith('testKey2');
      expect(redisClientStub.setex).to.have.been.calledWith('cachekeys|testPrefix');
      done();
    });
  });
});
