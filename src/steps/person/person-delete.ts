/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class DeletePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a SalesLoft person';
  protected stepExpression: string = 'delete the (?<email>.+) salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Person\'s email address',
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email: Object = stepData.email;

    try {
      const person = (await this.client.findPersonByEmail(email))[0];

      if (!person) {
        return this.error('Person %s not found', [
          email,
        ]);
      }

      await this.client.deletePerson(person['id']);
      return this.pass('Successfully deleted SalesLoft person %s.', [
        email,
      ]);
    } catch (e) {
      return this.error('There was an error deleting the person in SalesLoft: %s.', [
        e.toString(),
      ]);
    }
  }

}

export { DeletePersonStep as Step };
