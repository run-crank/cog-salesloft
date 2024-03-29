/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class PersonDiscover extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a Salesloft person';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'discover fields on salesloft person (?<email>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['discover'];
  protected targetObject: string = 'Person';
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Person's email address",
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
    const email = stepData.email;

    try {
      const person = (await this.client.findPersonByEmail(email))[0];
      if (!person) {
        return this.fail('Person %s not found.', [email]);
      }

      const record = this.createRecord(person);

      return this.pass('Successfully discovered fields on person', [], [record]);

    } catch (e) {
      return this.error('There was an error checking the person: %s', [e.message]);
    }
  }

  createRecord(person: Record<string, any>) {
    const record = {};

    //// Handle non-object and non-array. Ensure that we only get custom_fields
    Object.keys(person).forEach((key) => {
      if (typeof person[key] !== 'object') {
        record[key] = person[key];
      }
    });

    //// Handle Custom Fields
    if (person['custom_fields']) {
      Object.keys(person['custom_fields']).forEach((key) => {
        record[key] = person['custom_fields'][key];
      });
    }

    return this.keyValue('discoverPerson', 'Discovered Person', record);
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
    records.push(this.keyValue('discoverPerson', 'Discovered Person', obj));
    // Ordered Record
    records.push(this.keyValue(`discoverPerson.${stepOrder}`, `Discovered Person from Step ${stepOrder}`, obj));
    return records;
  }
}

export { PersonDiscover as Step };
