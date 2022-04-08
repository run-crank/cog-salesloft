/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateActivityStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesloft Activity';
  protected stepExpression: string = 'create a salesloft activity';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
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
      description: "Call's Salesloft ID",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Call's Salesloft Created At",
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Call's Salesloft Updated At",
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

    if (!person) {
      return this.fail('Person %s not found.', [
        email,
      ]);
    }

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
      let orderedRecord: any;

      response = await this.client.createCall(payload);
      record = this.createRecord(response);
      orderedRecord = this.createOrderedRecord(response, stepData['__stepOrder']);
      return this.pass(
        'Successfully created Salesloft call %s with disposition %s and segment %s.',
        [email, disposition, sentiment],
        [record, orderedRecord],
      );
    } catch (e) {
      return this.error(
        'There was an error creating the call in Salesloft: %s.',
        [e.toString()],
      );
    }
  }

  public createRecord(call): StepRecord {
    return this.keyValue('call', 'Created Call', { id: call.id });
  }

  public createOrderedRecord(call, stepOrder = 1): StepRecord {
    return this.keyValue(`call.${stepOrder}`, `Created Call from Step ${stepOrder}`, { id: call.id });
  }
}

export { CreateActivityStep as Step };
