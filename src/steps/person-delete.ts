/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class DeletePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a SalesLoft person';
  protected stepExpression: string = 'delete the (?<email>.+) salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'The person\'s email to be deleted',
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email: Object = stepData.email;

    try {
      await this.client.deletePersonByEmail(email);
      return this.pass('Successfully deleted SalesLoft person %s', [
        email,
      ]);
    } catch (e) {
      return this.error('There was an error deleting the person in SalesLoft: %s', [
        e.toString(),
      ]);
    }
  }

}

export { DeletePersonStep as Step };
