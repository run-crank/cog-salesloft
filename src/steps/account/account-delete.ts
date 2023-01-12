/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class DeleteAccountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesloft account';
  protected stepExpression: string = 'delete the (?<name>.+) salesloft account from (?<domain>.+) domain';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Account';

  protected expectedFields: Field[] = [{
    field: 'name',
    type: FieldDefinition.Type.STRING,
    description: 'Account\'s name',
  }, {
    field: 'domain',
    type: FieldDefinition.Type.STRING,
    description: 'Account\'s domain',
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

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const name: Object = stepData.name;
    const domain: Object = stepData.domain;

    try {
      const account = (await this.client.findAccountByDomain(domain)).find(account => account['name'] === name);

      if (!account) {
        return this.error('Account %s from %s domain not found', [
          name,
          domain,
        ]);
      }

      await this.client.deleteAccount(account.id, domain);

      const record = this.keyValue('account', 'Deleted Account', { id: account.id });
      return this.pass(
        'Successfully deleted Salesloft account %s.',
        [name],
        [record],
      );
    } catch (e) {
      return this.error('There was an error deleting the account in Salesloft: %s.', [
        e.toString(),
      ]);
    }
  }

}

export { DeleteAccountStep as Step };
