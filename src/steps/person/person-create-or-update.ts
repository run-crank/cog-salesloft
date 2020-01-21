/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class CreateOrUpdatePersonStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create or update a SalesLoft person';
  protected stepExpression: string = 'create or update a salesloft person';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'person',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
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

      if (!existingPerson) {
        await this.client.createPerson(payload);
      } else {
        await this.client.updatePerson(existingPerson['id'], payload);
      }

      return this.pass('Successfully created or updated SalesLoft person %s.', [
        payload['email_address'],
      ]);
    } catch (e) {
      return this.error('There was an error creating or updating the person in SalesLoft: %s.', [
        e.toString(),
      ]);
    }
  }

}

export { CreateOrUpdatePersonStep as Step };
