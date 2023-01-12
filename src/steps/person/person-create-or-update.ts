/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateOrUpdatePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create or update a Salesloft person';
  protected stepExpression: string = 'create or update a salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create', 'update'];
  protected targetObject: string = 'Person';

  protected expectedFields: Field[] = [{
    field: 'person',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
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

  private personStandardWriteableFields: string[] = [
    'email_address',
    'secondary_email_address',
    'personal_email_address',
    'first_name',
    'last_name',
    'phone',
    'phone_extension',
    'mobile_phone',
    'home_phone',
    'linkedin_url',
    'title',
    'city',
    'state',
    'country',
    'work_city',
    'work_state',
    'work_country',
    'person_company_name',
    'person_company_website',
    'person_company_industry',
    'job_seniority',
    'do_not_contact',
    'do_not_call',
    'do_not_email',
    'locale',
    'personal_website',
    'twitter_handle',
    'account_id',
    'owner_id',
    'import_id',
    'person_stage_id',
    'autotag_date',
  ];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const person: Object = stepData.person;
    const payload = { custom_fields: {} };

    Object.keys(person).forEach((key) => {
      if (this.personStandardWriteableFields.includes(key)) {
        payload[key] = person[key];
      } else {
        payload.custom_fields[key] = person[key];
      }
    });

    try {
      const existingPerson = (await this.client.findPersonByEmail(payload['email_address']))[0];
      let response;
      let record;
      let orderedRecord;

      if (!existingPerson) {
        response = await this.client.createPerson(payload);
        record = this.createRecord(response);
        orderedRecord = this.createOrderedRecord(response, stepData['__stepOrder']);
      } else {
        response = await this.client.updatePerson(existingPerson.id, payload);
        record = this.createRecord(response);
        orderedRecord = this.createOrderedRecord(response, stepData['__stepOrder']);
      }

      return this.pass(
        'Successfully created or updated Salesloft person %s.',
        [payload['email_address']],
        [record, orderedRecord],
      );
    } catch (e) {
      return this.error(
        'There was an error creating or updating the person in Salesloft: %s.',
        [e.toString()],
      );
    }
  }

  public createRecord(person): StepRecord {
    const obj = {};
    Object.keys(person).forEach(key => obj[key] = person[key]);
    const record = this.keyValue('person', 'Created or Updated Person', obj);
    return record;
  }

  public createOrderedRecord(person, stepOrder = 1): StepRecord {
    const obj = {};
    Object.keys(person).forEach(key => obj[key] = person[key]);
    const record = this.keyValue(`person.${stepOrder}`, `Created or Updated Person from Step ${stepOrder}`, obj);
    return record;
  }
}

export { CreateOrUpdatePersonStep as Step };
