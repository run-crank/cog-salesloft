import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/person/person-create-or-update';

chai.use(sinonChai);

describe('CreateOrUpdatePersonStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findPersonByEmail = sinon.stub();
    clientWrapperStub.createPerson = sinon.stub();
    clientWrapperStub.createPerson.returns(Promise.resolve({ id: 322 }));
    clientWrapperStub.updatePerson = sinon.stub();
    clientWrapperStub.updatePerson.returns(Promise.resolve({ id: 322 }));
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateOrUpdatePersonStep');
      expect(stepDef.getName()).to.equal('Create or update a Salesloft Person');
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
      it('should call findPersonByEmail with expected person', async () => {
        const expectedEmail: string = 'salesloft@test.com';
        const person = {
          email_address: expectedEmail,
        };
        protoStep.setData(Struct.fromJavaScript({
          person,
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.findPersonByEmail).to.have.been.calledWith(expectedEmail);
      });
    });

    describe('Non-existing Person', () => {
      const expectedParameters = {
        email_address: 'salesloft@test.com',
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          person: expectedParameters,
        }));
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([{}]));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Existing Person', () => {
      const expectedParameters = {
        email_address: 'salesloft@test.com',
        id: 1,
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          person: expectedParameters,
        }));
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([expectedParameters]));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });
  });
});
