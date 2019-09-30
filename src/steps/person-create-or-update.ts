/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class CreateOrUpdatePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create or update a SalesLoft person';
  protected stepExpression: string = 'create or update a salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'person',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const person: Object = stepData.person;

    try {
      const existingPerson = (await this.client.findPersonByEmail(person['email_address']))[0];

      if (!existingPerson) {
        await this.client.createPerson(person);
      } else {
        await this.client.updatePerson(existingPerson['id'], person);
      }

      return this.pass('Successfully created or updated SalesLoft person %s.', [
        person['email_address'],
      ]);
    } catch (e) {
      return this.error('There was an error creating or updating the person in SalesLoft: %s.', [
        e.toString(),
      ]);
    }
  }

}

export { CreateOrUpdatePersonStep as Step };
