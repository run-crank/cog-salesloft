/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CreateOrUpdateAccountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create or update a Salesloft account';
  protected stepExpression: string = 'create or update a salesloft account';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'account',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'account',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Account's Salesloft ID",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Account's Salesloft Created At",
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Account's Salesloft Updated At",
    }],
    dynamicFields: true,
  }];

  private accountStandardWriteableFields: string[] = [
    'name',
    'domain',
    'conversational_name',
    'description',
    'phone',
    'website',
    'linkedin_url',
    'twitter_handle',
    'street',
    'city',
    'state',
    'postal_code',
    'country',
    'locale',
    'industry',
    'company_type',
    'founded',
    'revenue_range',
    'size',
    'do_not_contact',
    'custom_fields',
    'tags',
    'owner_id',
    'company_stage_id',
    'account_tier_id',
    'crm_id_type',
    'crm_id',
  ];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const account: Object = stepData.account;
    const payload = { custom_fields: {} };

    Object.keys(account).forEach((key) => {
      if (this.accountStandardWriteableFields.includes(key)) {
        payload[key] = account[key];
      } else {
        payload.custom_fields[key] = account[key];
      }
    });

    try {
      const existingPerson = (await this.client.findAccountByDomain(payload['domain'])).find(account => account['name'] === payload['name']);
      let response;
      let record;
      if (!existingPerson) {
        response = await this.client.createAccount(payload);
        record = this.keyValue('account', 'Created Account', { id: response.id });
      } else {
        response = await this.client.updateAccount(existingPerson.id, payload);
        record = this.keyValue('account', 'Updated Account', { id: response.id });
      }

      return this.pass(
        'Successfully created or updated Salesloft account %s.',
        [payload['name']],
        [record],
      );
    } catch (e) {
      return this.error(
        'There was an error creating or updating the account in Salesloft: %s.',
        [e.toString()],
      );
    }
  }
}

export { CreateOrUpdateAccountStep as Step };
