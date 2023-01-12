/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class DeletePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesloft person';
  protected stepExpression: string = 'delete the (?<email>.+) salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Person';

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Person\'s email address',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'person',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Person's Salesloft ID",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Person's Salesloft Created At",
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Person's Salesloft Updated At",
    }],
    dynamicFields: true,
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

      await this.client.deletePerson(person.id, email);

      const record = this.keyValue('person', 'Deleted Person', { id: person.id });
      return this.pass(
        'Successfully deleted Salesloft person %s.',
        [email],
        [record],
      );
    } catch (e) {
      return this.error('There was an error deleting the person in Salesloft: %s.', [
        e.toString(),
      ]);
    }
  }

}

export { DeletePersonStep as Step };
