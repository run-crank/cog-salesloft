import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';
import { PersonRequest } from 'salesloft/dist/resources/People';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let salesloftClientStub: any;
  let salesloftConstructorStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    salesloftClientStub = {
      People: {
        list: sinon.spy(),
        create: sinon.spy(),
        update: sinon.spy(),
        delete: sinon.spy(),
      },
    };
    salesloftConstructorStub = sinon.stub();
    salesloftConstructorStub.returns(salesloftClientStub);
  });

  describe('constructor', () => {
    it('should authenticate', () => {
      const expectedArgs = 'apiKey';
      metadata = new Metadata();
      metadata.add('apikey', expectedArgs);

      clientWrapperUnderTest = new ClientWrapper(metadata, salesloftConstructorStub);
      expect(salesloftConstructorStub).to.have.been.calledWith(expectedArgs);
    });
  });

  describe('findPersonByEmail', () => {
    it('should call with expectedArgs', async () => {
      const expectedArgs = {
        email_addresses: ['salesloft@test.com'],
      };

      clientWrapperUnderTest = new ClientWrapper(new Metadata(), salesloftConstructorStub);
      await clientWrapperUnderTest.findPersonByEmail('salesloft@test.com');
      expect(salesloftClientStub.People.list).to.have.been.calledWith(expectedArgs);
    });
  });

  describe('createPerson', () => {
    it('should call with expectedArgs', async () => {
      const expectedArgs: PersonRequest = {
        email_address: 'salesloft@test.com',
        last_name: 'Test',
        first_name: 'Unit',
      };

      clientWrapperUnderTest = new ClientWrapper(new Metadata(), salesloftConstructorStub);
      await clientWrapperUnderTest.createPerson(expectedArgs);
      expect(salesloftClientStub.People.create).to.have.been.calledWith(expectedArgs);
    });
  });

  describe('updatePerson', () => {
    it('should call with expectedArgs', async () => {
      const expectedArgs: any = {
        id: 1,
        email_address: 'salesloft@test.com',
        last_name: 'Test',
        first_name: 'Unit',
      };

      clientWrapperUnderTest = new ClientWrapper(new Metadata(), salesloftConstructorStub);
      await clientWrapperUnderTest.updatePerson(expectedArgs['id'], expectedArgs);
      expect(salesloftClientStub.People.update).to.have.been.calledWith(
          expectedArgs['id'], expectedArgs);
    });
  });

  describe('deletePerson', () => {
    it('should call with expectedArgs', async () => {
      const expectedArgs: number = 1;

      clientWrapperUnderTest = new ClientWrapper(new Metadata(), salesloftConstructorStub);
      await clientWrapperUnderTest.deletePerson(expectedArgs);
      expect(salesloftClientStub.People.delete).to.have.been.calledWith(expectedArgs);
    });
  });
});
