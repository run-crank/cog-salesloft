/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CreateCallStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a SalesLoft call';
  protected stepExpression: string = 'create a salesloft call';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.STRING,
    description: "Person's email address whom the CRM activity will be logged to",
  }, {
    field: 'disposition',
    type: FieldDefinition.Type.STRING,
    description: 'The disposition of the call',
  }, {
    field: 'sentiment',
    type: FieldDefinition.Type.STRING,
    description: 'The sentiment of the call',
  }, {
    field: 'notes',
    type: FieldDefinition.Type.STRING,
    description: 'The notes of the call',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'call',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Call's SalesLoft ID",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Call's SalesLoft Created At",
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Call's SalesLoft Updated At",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const sentiment: string = stepData.sentiment;
    const disposition: string = stepData.disposition;

    // Get the person by email to get the personId
    const person = (await this.client.findPersonByEmail(email))[0];

    const payload = {
      person_id: person.id,
      sentiment: stepData.sentiment,
      disposition: stepData.disposition,
      notes: stepData.notes,
      crm_params: {},
    };

    try {
      let response: any;
      let record: any;

      response = await this.client.createCall(payload);
      record = this.keyValue('call', 'Created Call', { id: response.id });

      return this.pass(
        'Successfully created SalesLoft call %s with disposition %s and segment %s.',
        [email, disposition, sentiment],
        [record],
      );
    } catch (e) {
      return this.error(
        'There was an error creating the call in SalesLoft: %s.',
        [e.toString()],
      );
    }
  }
}

export { CreateCallStep as Step };
