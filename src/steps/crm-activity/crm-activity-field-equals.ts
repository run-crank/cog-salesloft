/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class CrmActivityFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a CRM Activity';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[ a-zA-Z0-9_-]+) field on a record from (?<source>.+) source logged from (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'source',
    type: FieldDefinition.Type.STRING,
    description: "CRM Activity's source",
  },
  {
    field: 'email',
    type: FieldDefinition.Type.STRING,
    description: "Person's email address whom the CRM activity is logged",
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
    id: 'crmActivity',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: "CRM Activity's SalesLoft ID",
    }, {
      field: 'created_at',
      type: FieldDefinition.Type.DATETIME,
      description: "CRM Activity's SalesLoft Created At",
    }, {
      field: 'updated_at',
      type: FieldDefinition.Type.DATETIME,
      description: "CRM Activity's SalesLoft Updated At",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const source = stepData.source;
    const email = stepData.email;
    const field = stepData.field;
    const operator: string = stepData.operator || 'be';

    if (isNullOrUndefined(expectation) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      // Get all activities by source
      const activities = await this.client.getAllCrmActivites();

      if (activities.length === 0) {
        return this.fail("No activities logged for source '%s'.", [
          source,
        ]);
      }

      // Get the person by email to get the personId
      const person = (await this.client.findPersonByEmail(email))[0];

      // Filter out by personId and source
      const filteredActivities = activities.filter(activity => activity['person'].id === person.id && activity['activity_type'] === source);

      const record = this.createRecord(filteredActivities);
      const validResults = [];
      let result = {
        valid: false,
        message: '',
      };

      // Assert field
      filteredActivities.forEach((activity) => {
        const assertResult = this.assert(operator, activity[field], expectation, field);
        if (assertResult.valid) {
          validResults.push(activity);
          result = assertResult;
        }
      });

      console.log(validResults);
      if (validResults.length === 0) {
        return this.fail("There were no valid activities logged for source '%s' with %s %s %s.", [
          source,
          field,
          operator,
          expectation,
        ]);
      }

      if (validResults.length > 1) {
        return this.error("There were more than one valid activities logged for source '%s' with %s %s %s.", [
          source,
          field,
          operator,
          expectation,
        ]);
      }

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error checking the crm activity field: %s', [e.message]);
    }
  }

  createRecord(crmActivity: Record<string, any>) {
    const record = {};

    Object.keys(crmActivity).forEach((key) => {
      if (typeof crmActivity[key] !== 'object') {
        record[key] = crmActivity[key];
      }
    });

    return this.keyValue('crmActivity', 'Checked CRM Activity', record);
  }
}

export { CrmActivityFieldEqualsStep as Step };
