/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CreateOrUpdatePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create or update a SalesLoft person';
  protected stepExpression: string = 'create or update a salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

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

      if (!existingPerson) {
        response = await this.client.createPerson(payload);
        record = this.keyValue('person', 'Created Person', { id: response.id });
      } else {
        response = await this.client.updatePerson(existingPerson.id, payload);
        record = this.keyValue('person', 'Updated Person', { id: response.id });
      }

      return this.pass(
        'Successfully created or updated SalesLoft person %s.',
        [payload['email_address']],
        [record],
      );
    } catch (e) {
      return this.error(
        'There was an error creating or updating the person in SalesLoft: %s.',
        [e.toString()],
      );
    }
  }
}

export { CreateOrUpdatePersonStep as Step };
