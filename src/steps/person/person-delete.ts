/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class DeletePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a SalesLoft person';
  protected stepExpression: string = 'delete the (?<email>.+) salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

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
      description: "Person's SalesLoft ID",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Person's SalesLoft Created At",
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Person's SalesLoft Updated At",
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

      await this.client.deletePerson(person.id);

      const record = this.keyValue('person', 'Deleted Person', { id: person.id });
      return this.pass(
        'Successfully deleted SalesLoft person %s.',
        [email],
        [record],
      );
    } catch (e) {
      return this.error('There was an error deleting the person in SalesLoft: %s.', [
        e.toString(),
      ]);
    }
  }

}

export { DeletePersonStep as Step };
