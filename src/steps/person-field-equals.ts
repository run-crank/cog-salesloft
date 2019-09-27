/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class PersonFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a SalesLoft Person';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on salesloft person (?<email>.+) should be (?<expectation>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Person's email address",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'expectation',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const email = stepData.email;
    const field = stepData.field;

    try {
      const person = (await this.client.findPersonByEmail(email))[0];

      if (!person) {
        return this.error('Person %s not found.', [
          email,
        ]);
      }

      // tslint:disable-next-line:triple-equals
      if (person[field] == expectation) {
        return this.pass('The %s field was %s, as expected.', [
          field,
          expectation,
        ]);
      } else {
        return this.fail('Expected %s to be %s, but it was actually %s.', [
          field,
          expectation,
          person[field],
        ]);
      }
    } catch (e) {
      return this.error('There was an error loading contacts from SalesLoft: %s.', [e.toString()]);
    }
  }

}

export { PersonFieldEqualsStep as Step };
