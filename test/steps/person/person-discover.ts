import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/person/person-discover';

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
      expect(stepDef.getStepId()).to.equal('PersonDiscover');
      expect(stepDef.getName()).to.equal('Discover fields on a Salesloft person');
      expect(stepDef.getExpression()).to.equal('discover fields on salesloft person (?<email>.+)');
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
    describe('Person not found', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          email: 'salesloft@test.com',
          field: 'email_address',
          expectation: 'salesloft@test.com',
        }));
        clientWrapperStub.findPersonByEmail.returns(Promise.resolve([]));
      });

      it('should respond with fail', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
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
