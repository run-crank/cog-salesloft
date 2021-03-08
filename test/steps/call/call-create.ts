import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/call/call-create';

chai.use(sinonChai);

describe('CreateCallStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findPersonByEmail = sinon.stub();
    clientWrapperStub.createCall = sinon.stub();
    clientWrapperStub.createCall.returns(Promise.resolve({ id: 322 }));
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateCallStep');
      expect(stepDef.getName()).to.equal('Create a SalesLoft call');
      expect(stepDef.getExpression()).to.equal('create a salesloft call');
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

      expect(fields[1].key).to.equal('disposition');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('sentiment');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[3].key).to.equal('notes');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[3].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      let call: any;
      let person: any;
      let payload: any;

      beforeEach(() => {
        call = {
          email: 'sample@sample.com',
          disposition: 'someDisposition',
          sentiment: 'someSentiment',
          notes: 'someNote',
        };

        person = {
          id: 1,
        };

        payload = {
          person_id: person.id,
          sentiment: call.sentiment,
          disposition: call.disposition,
          notes: call.notes,
          crm_params: {},
        };

        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([person]));
      });
      it('should call findAccountByDomain with expected account', async () => {
        protoStep.setData(Struct.fromJavaScript(call));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.findPersonByEmail).to.have.been.calledWith(call.email);
      });
    });

    describe('Non-existing Account', () => {
      const call = {
        email: 'sample@sample.com',
        disposition: 'someDisposition',
        sentiment: 'someSentiment',
        notes: 'someNote',
      };
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript(call));
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([]));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Existing Account', () => {
      let call: any;
      let person: any;
      beforeEach(() => {
        call = {
          email: 'sample@sample.com',
          disposition: 'someDisposition',
          sentiment: 'someSentiment',
          notes: 'someNote',
        };

        person = {
          id: 1,
        };

        protoStep.setData(Struct.fromJavaScript(call));
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([person]));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });
  });
});
