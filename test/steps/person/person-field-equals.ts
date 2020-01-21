import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/person/person-field-equals';

chai.use(sinonChai);

describe('PersonFieldEquals', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findPersonByEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('PersonFieldEqualsStep');
      expect(stepDef.getName()).to.equal('Check a field on a SalesLoft Person');
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_-]+) field on salesloft person (?<email>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectation>.+)');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('email');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.EMAIL);

      expect(fields[1].key).to.equal('field');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('operator');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[3].key).to.equal('expectation');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[3].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {
    describe('Person not found', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          email: 'salesloft@test.com',
          field: 'email_address',
          expectation: 'salesloft@test.com',
        }));
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([]));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Person found', () => {
      describe('Custom fields', () => {
        const foundPerson = {
          id: 1,
          email_address: 'salesloft@test.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
        };

        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'salesloft@test.com',
            field: 'MyCustomField',
            expectation: 'custom data',
          }));
          clientWrapperStub.findPersonByEmail.returns(Promise.resolve([foundPerson]));
        });

        it('should evaluate custom_fields properly', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });
      });

      describe('Expectation equals Actual', () => {
        const foundPerson = {
          id: 1,
          email_address: 'salesloft@test.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
          age: 25,
        };
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'salesloft@test.com',
            field: 'email_address',
            expectation: 'salesloft@test.com',
          }));
          clientWrapperStub.findPersonByEmail.returns(Promise.resolve([foundPerson]));
        });

        it('should respond with pass', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });

        it('should respond with error when invalid operator is passed', async () => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'salesloft@test.com',
            field: 'email_address',
            expectation: 'salesloft@test.com',
            operator: 'invalid operator',
          }));

          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });

        it('should respond with error when expected and actual values have different types and compared', async () => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'salesloft@test.com',
            field: 'age',
            expectation: 'nonNumeric',
            operator: 'be greater than',
          }));

          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });

      describe('Expectation not equals Actual', () => {
        const foundPerson = {
          id: 1,
          email_address: 'salesloft@test.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
        };
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'salesloft@test.com',
            field: 'email_address',
            expectation: 'wrong expectation',
          }));
          clientWrapperStub.findPersonByEmail.returns(Promise.resolve([foundPerson]));
        });

        it('should respond with failed', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Actual does not have field expected', () => {
        const foundPerson = {
          id: 1,
          not_email_address: 'salesloft@test.com',
          custom_fields: {
            MyCustomField: 'custom data',
          },
        };
        beforeEach(() => {
          protoStep.setData(Struct.fromJavaScript({
            email: 'salesloft@test.com',
            field: 'email_address',
            expectation: 'wrong expectation',
          }));
          clientWrapperStub.findPersonByEmail.returns(Promise.resolve([foundPerson]));
        });

        it('should respond with failed', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Error', () => {
        beforeEach(() => {
          clientWrapperStub.findPersonByEmail.throws();
        });

        it('should respond with error', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });
    });
  });
});
