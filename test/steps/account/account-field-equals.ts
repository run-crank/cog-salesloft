import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/account/account-field-equals';

chai.use(sinonChai);

describe('AccountFieldEquals', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findAccountByDomain = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('AccountFieldEqualsStep');
      expect(stepDef.getName()).to.equal('Check a field on a SalesLoft Account');
      expect(stepDef.getExpression()).to.equal('the (?<field>[ a-zA-Z0-9_-]+) field on salesloft account (?<name>.+) from (?<domain>.+) domain should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
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

      expect(fields[2].key).to.equal('field');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[3].key).to.equal('operator');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[3].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[4].key).to.equal('expectation');
      expect(fields[4].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[4].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {
    describe('Account not found', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          name: 'someName',
          domain: 'salesloft.com',
          field: 'domain',
          expectation: 'salesloft.com',
        }));
        clientWrapperStub.findAccountByDomain.returns(Promise.resolve([]));
      });

      it('should respond with fail', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Account found', () => {
      describe('Custom fields', () => {
        const foundAccount = {
          id: 1,
          name: 'someName',
          domain: 'salesloft.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            name: 'someName',
            domain: 'salesloft.com',
            field: 'MyCustomField',
            expectation: 'custom data',
          }));
          clientWrapperStub.findAccountByDomain.returns(Promise.resolve([foundAccount]));
        });

        it('should evaluate custom_fields properly', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });
      });

      describe('Expectation equals Actual', () => {
        const foundAccount = {
          id: 1,
          name: 'someName',
          domain: 'salesloft.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
          age: 25,
        };
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            name: 'someName',
            domain: 'salesloft.com',
            field: 'domain',
            expectation: 'salesloft.com',
          }));
          clientWrapperStub.findAccountByDomain.returns(Promise.resolve([foundAccount]));
        });

        it('should respond with pass', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });

        it('should respond with error when invalid operator is passed', async () => {
          protoStep.setData(Struct.fromJavaScript({
            name: 'someName',
            domain: 'salesloft.com',
            field: 'domain',
            expectation: 'salesloft.com',
            operator: 'invalid operator',
          }));

          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });

        it('should respond with error when expected and actual values have different types and compared', async () => {
          protoStep.setData(Struct.fromJavaScript({
            name: 'someName',
            domain: 'salesloft.com',
            field: 'domain',
            expectation: 'salesloft.com',
            operator: 'be greater than',
          }));

          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });

      describe('Expectation not equals Actual', () => {
        const foundAccount = {
          id: 1,
          name: 'someName',
          domain: 'salesloft.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
        };
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            name: 'someName',
            domain: 'salesloft.com',
            field: 'domain',
            expectation: 'wrong expectation',
          }));
          clientWrapperStub.findAccountByDomain.returns(Promise.resolve([foundAccount]));
        });

        it('should respond with failed', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Actual does not have field expected', () => {
        const foundAccount = {
          id: 1,
          not_email_address: 'salesloft@test.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
        };
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            name: 'someName',
            domain: 'salesloft.com',
            field: 'email_address',
            expectation: 'wrong expectation',
          }));
          clientWrapperStub.findAccountByDomain.returns(Promise.resolve([foundAccount]));
        });

        it('should respond with failed', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
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
});
