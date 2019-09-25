import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/person-create-or-update';

chai.use(sinonChai);

describe('CreateOrUpdateContactStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createOrUpdatePerson = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateOrUpdatePersonStep');
      expect(stepDef.getName()).to.equal('Create or update a SalesLoft person');
      expect(stepDef.getExpression()).to.equal('create or update a salesloft person');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('person');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call createOrUpdatePerson with expected person', async () => {
        const expectedEmail: string = 'salesloft@test.com';
        const person = {
          email_address: expectedEmail,
        };
        protoStep.setData(Struct.fromJavaScript({
          person,
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.createOrUpdatePerson).to.have.been.calledWith(
            person);
      });
    });

    describe('Person successfully created or updated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          person:  { email_address: 'salesloft@test.com' },
        }));
        clientWrapperStub.createOrUpdatePerson.returns(Promise.resolve({ id: 123456 }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Contact not created nor updated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          person:  { email_address: 'salesloft@test.com' },
        }));
        clientWrapperStub.createOrUpdatePerson.returns(Promise.resolve(undefined));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          person:  { email_address: 'salesloft@test.com' },
        }));
        clientWrapperStub.createOrUpdatePerson.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
