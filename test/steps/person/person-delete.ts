import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/person/person-delete';

chai.use(sinonChai);

describe('DeletePersonStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findPersonByEmail = sinon.stub();
    clientWrapperStub.deletePerson = sinon.spy();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DeletePersonStep');
      expect(stepDef.getName()).to.equal('Delete a Salesloft Person');
      expect(stepDef.getExpression()).to.equal('delete the (?<email>.+) salesloft person');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('email');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.EMAIL);
    });
  });

  describe('ExecuteStep', () => {
    beforeEach(() => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'salesloft@test.com',
      }));
    });
    describe('Person not found', () => {
      beforeEach(() => {
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([]));
      });

      it('should return error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Person found', () => {
      const foundPerson = {
        id: 1,
        email_address: 'salesloft@test.com',
      };
      beforeEach(() => {
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([foundPerson]));
      });

      it('should call deletePerson with expectedParameters', async () => {
        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.deletePerson).to.have.been.calledWith(foundPerson['id']);
      });

      it('should respond with pass', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
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
