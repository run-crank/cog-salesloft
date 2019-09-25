import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/person-delete';

chai.use(sinonChai);

describe('DeletePersonStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.deletePersonByEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DeletePersonStep');
      expect(stepDef.getName()).to.equal('Delete a SalesLoft person');
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
    describe('Expected Parameters', () => {
      it('should call deletePersonByEmail with expected email', async () => {
        const expectedEmail: string = 'salesloft@test.com';
        protoStep.setData(Struct.fromJavaScript({
          email: expectedEmail,
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.deletePersonByEmail).to.have.been.calledWith(expectedEmail);
      });
    });

    describe('Contact successfully deleted', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          email: 'salesloft@test.com',
        }));
        clientWrapperStub.deletePersonByEmail.returns(Promise.resolve({
          deleted: true,
          reason: 'OK',
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          email: 'salesloft@test.com',
        }));
        clientWrapperStub.deletePersonByEmail.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
