/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class AccountFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a SalesLoft Account';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[ a-zA-Z0-9_-]+) field on salesloft account (?<name>.+) from (?<domain>.+) domain should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'name',
    type: FieldDefinition.Type.STRING,
    description: "Account's name",
  }, {
    field: 'domain',
    type: FieldDefinition.Type.STRING,
    description: "Account's domain",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectation',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'account',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Account's SalesLoft ID",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Account's SalesLoft Created At",
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: "Account's SalesLoft Updated At",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const name = stepData.name;
    const domain = stepData.domain;
    const field = stepData.field;
    const operator: string = stepData.operator || 'be';

    if (isNullOrUndefined(expectation) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      const account = (await this.client.findAccountByDomain(domain)).find(account => account['name'] === name);

      if (!account) {
        return this.fail('Account %s from %s domain not found.', [
          name,
          domain,
        ]);
      }

      let actual = account[field] === undefined ? account['custom_fields'][field] : account[field];
      actual = actual === undefined ? null : actual;

      const record = this.createRecord(account);
      const result = this.assert(operator, actual, expectation, field);

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error checking the account field: %s', [e.message]);
    }
  }

  createRecord(account: Record<string, any>) {
    const record = {};

    //// Handle non-object and non-array. Ensure that we only get custom_fields
    Object.keys(account).forEach((key) => {
      if (typeof account[key] !== 'object') {
        record[key] = account[key];
      }
    });

    //// Handle Custom Fields
    if (account['custom_fields']) {
      Object.keys(account['custom_fields']).forEach((key) => {
        record[key] = account['custom_fields'][key];
      });
    }

    return this.keyValue('account', 'Checked Account', record);
  }
}

export { AccountFieldEqualsStep as Step };
