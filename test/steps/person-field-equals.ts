import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/person-field-equals';

chai.use(sinonChai);

describe('PersonFieldEquals', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getPersonByEmail = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('PersonFieldEqualsStep');
      expect(stepDef.getName()).to.equal('Check a field on a SalesLoft Contact');
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_-]+) field on salesloft contact (?<email>.+) should be (?<expectation>.+)');
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

      expect(fields[2].key).to.equal('expectation');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call getPersonByEmail with expected email', async () => {
        const expectedEmail: string = 'salesloft@test.com';
        protoStep.setData(Struct.fromJavaScript({
          email: expectedEmail,
          expectation: 'doe',
          field: 'lastname',
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.getPersonByEmail).to.have.been.calledWith(expectedEmail);
      });
    });

    describe('Person expected field value equals expectation', () => {
      beforeEach(() => {
        const expectedEmail: string = 'salesloft@test.com';
        const expectedLastname: string = 'doe';
        protoStep.setData(Struct.fromJavaScript({
          email: expectedEmail,
          expectation: expectedLastname,
          field: 'last_name',
        }));
        clientWrapperStub.getPersonByEmail.returns(Promise.resolve({
          email_address: expectedEmail,
          last_name: expectedLastname,
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Person expected field value not equal expectation', () => {
      beforeEach(() => {
        const expectedEmail: string = 'salesloft@test.com';
        const expectedLastname: string = 'doe';
        protoStep.setData(Struct.fromJavaScript({
          email: expectedEmail,
          expectation: 'wrong expectation',
          field: 'last_name',
        }));
        clientWrapperStub.getPersonByEmail.returns(Promise.resolve({
          email_address: expectedEmail,
          last_name: expectedLastname,
        }));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          email: 'salesloft@test.com',
        }));
        clientWrapperStub.getPersonByEmail.throws('error');
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
