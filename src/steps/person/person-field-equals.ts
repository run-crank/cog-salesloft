/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class PersonFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesloft Person';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[ a-zA-Z0-9_-]+) field on salesloft person (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Person's email address",
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
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const email = stepData.email;
    const field = stepData.field;
    const operator: string = stepData.operator || 'be';

    if (isNullOrUndefined(expectation) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      const person = (await this.client.findPersonByEmail(email))[0];
      if (!person) {
        return this.fail('Person %s not found.', [
          email,
        ]);
      }

      let actual = person[field] === undefined ? person['custom_fields'][field] : person[field];
      actual = actual === undefined ? null : actual;

      const records = this.createRecords(person, stepData['__stepOrder']);

      if (!person.hasOwnProperty(stepData.field) && !person['custom_fields'].hasOwnProperty(stepData.field)) {
        // If the given field does not exist on the account, return an error.
        return this.fail('The %s field does not exist on Person %s', [field, email], records);
      }

      const result = this.assert(operator, actual, expectation, field);

      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error checking the person field: %s', [e.message]);
    }
  }

  public createRecords(person, stepOrder = 1): StepRecord[] {
    const obj = {};

    //// Handle non-object and non-array. Ensure that we only get custom_fields
    Object.keys(person).forEach((key) => {
      if (typeof person[key] !== 'object') {
        obj[key] = person[key];
      }
    });

    //// Handle Custom Fields
    if (person['custom_fields']) {
      Object.keys(person['custom_fields']).forEach((key) => {
        obj[key] = person['custom_fields'][key];
      });
    }

    const records = [];
    // Base Record
    records.push(this.keyValue('person', 'Checked Account', obj));
    // Ordered Record
    records.push(this.keyValue(`person.${stepOrder}`, `Checked Account from Step ${stepOrder}`, obj));
    return records;
  }
}

export { PersonFieldEqualsStep as Step };
