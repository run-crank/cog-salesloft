import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/crm-activity/crm-activity-field-equals';

chai.use(sinonChai);

describe('ActivityFieldEquals', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findPersonByEmail = sinon.stub();
    clientWrapperStub.getAllCrmActivites = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ActivityFieldEqualsStep');
      expect(stepDef.getName()).to.equal('Check a field on a Salesloft activity');
      expect(stepDef.getExpression()).to.equal('the (?<field>[ a-zA-Z0-9_-]+) field on a record from (?<source>.+) source logged from (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('source');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('email');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.EMAIL);

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
    describe('Person not found', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          source: 'someSource',
          email: 'sample@sample.com',
          field: 'someField',
          expectation: 'someValue',
        }));
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([]));
      });

      it('should respond with fail', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Person found', () => {
      describe('Expectation equals Actual', () => {
        let data;
        let activity;
        beforeEach(() => {
          data = {
            source: 'someSource',
            email: 'sample@sample.com',
            field: 'someField',
            expectation: 'someValue',
          };
          activity = {
            id: 1,
            someField: 'someValue',
            activity_type: 'someSource',
            person: {
              id: 1,
            },
          };
          protoStep.setData(Struct.fromJavaScript(data));
          clientWrapperStub.findPersonByEmail.returns(Promise.resolve([{
            id: activity.person.id,
          }]));
          clientWrapperStub.getAllCrmActivites.returns(Promise.resolve([activity]));
        });

        it('should respond with pass', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
        });

        it('should respond with error when invalid operator is passed', async () => {
          protoStep.setData(Struct.fromJavaScript({
            source: 'someSource',
            email: 'sample@sample.com',
            field: 'someField',
            operator: 'invalid operator',
            expectation: 'someValue',
          }));
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });

        it('should respond with error when expected and actual values have different types and compared', async () => {
          protoStep.setData(Struct.fromJavaScript({
            source: 'someSource',
            email: 'sample@sample.com',
            field: 'someField',
            expectation: 'someValue',
            operator: 'be greater than',
          }));

          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });

      describe('Expectation not equals Actual', () => {
        let data;
        beforeEach(() => {
          data = {
            source: 'someSource',
            email: 'sample@sample.com',
            field: 'someField',
            expectation: 'someValue',
          };
          protoStep.setData(Struct.fromJavaScript(data));
          clientWrapperStub.findPersonByEmail.returns(Promise.resolve([]));
        });

        it('should respond with failed', async () => {
          const response = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
        });
      });

      describe('Actual does not have field expected', () => {
        let data;
        let activity;
        beforeEach(() => {
          data = {
            source: 'someSource',
            email: 'sample@sample.com',
            field: 'someOtherField',
            expectation: 'someValue',
          };
          activity = {
            id: 1,
            someField: 'someValue',
            activity_type: 'someSource',
            person: {
              id: 1,
            },
          };
          protoStep.setData(Struct.fromJavaScript(data));
          clientWrapperStub.findPersonByEmail.returns(Promise.resolve([{
            id: activity.person.id,
          }]));
          clientWrapperStub.getAllCrmActivites.returns(Promise.resolve([activity]));
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
