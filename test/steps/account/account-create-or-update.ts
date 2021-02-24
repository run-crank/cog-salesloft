import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/account/account-create-or-update';

chai.use(sinonChai);

describe('CreateOrUpdateAccountStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findAccountByDomain = sinon.stub();
    clientWrapperStub.createAccount = sinon.stub();
    clientWrapperStub.createAccount.returns(Promise.resolve({ id: 322 }));
    clientWrapperStub.updateAccount = sinon.stub();
    clientWrapperStub.updateAccount.returns(Promise.resolve({ id: 322 }));
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateOrUpdateAccountStep');
      expect(stepDef.getName()).to.equal('Create or update a SalesLoft account');
      expect(stepDef.getExpression()).to.equal('create or update a salesloft account');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('account');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call findAccountByDomain with expected account', async () => {
        const expectedDomain: string = 'salesloft.com';
        const account = {
          domain: expectedDomain,
          name: 'someName',
        };
        protoStep.setData(Struct.fromJavaScript({
          account,
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.findAccountByDomain).to.have.been.calledWith(expectedDomain);
      });
    });

    describe('Non-existing Account', () => {
      const expectedParameters = {
        domain: 'salesloft.com',
        name: 'someName',
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          account: expectedParameters,
        }));
        clientWrapperStub.findAccountByDomain.returns(Promise.resolve([{}]));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Existing Account', () => {
      const expectedParameters = {
        domain: 'salesloft.com',
        name: 'someName',
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          account: expectedParameters,
        }));
        clientWrapperStub.findAccountByDomain.returns(Promise.resolve([expectedParameters]));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });
  });
});
