import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/account/account-delete';

chai.use(sinonChai);

describe('DeleteAccountStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findAccountByDomain = sinon.stub();
    clientWrapperStub.deleteAccount = sinon.spy();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DeleteAccountStep');
      expect(stepDef.getName()).to.equal('Delete a Salesloft account');
      expect(stepDef.getExpression()).to.equal('delete the (?<name>.+) salesloft account from (?<domain>.+) domain');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('name');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('domain');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('ExecuteStep', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        domain: 'salesloft.com',
        name: 'someName',
      }));
    });
    describe('Account not found', () => {
      beforeEach(() => {
        clientWrapperStub.findAccountByDomain.returns(Promise.resolve([]));
      });

      it('should return error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Account found', () => {
      const foundAccount = {
        id: 1,
        domain: 'salesloft.com',
        name: 'someName',
      };
      beforeEach(() => {
        clientWrapperStub.findAccountByDomain.returns(Promise.resolve([foundAccount]));
      });

      it('should call deleteAccount with expectedParameters', async () => {
        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.deleteAccount).to.have.been.calledWith(foundAccount['id']);
      });

      it('should respond with pass', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Error', () => {
      beforeEach(() => {
        clientWrapperStub.findAccountByDomain.throws();
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
