'use strict';

import _ from 'lodash';
import Parser from './base';
import { ShortCircuitError } from '../errors';

export default class ExtractRelationships extends Parser {
  constructor(mapper) {
    this.mapper = mapper;
  }

  parse(promise) {
    return promise.then((resultset) => {
      if (! resultset._related) {
        return resultset;
      }

      let related = resultset._related;

      var payload = _.map(resultset.rows, (row) => {
        let baseEntity = row[this.mapper.tableName];

        _.each(related, (relationship) => {
          let { model, alias } = this.mapper.relationships[relationship];
          baseEntity[relationship] = new model(row[alias]);
        });

        let model = new this.mapper.model(baseEntity);

        return model;
      });

      let err = new ShortCircuitError(payload);
      throw err;
    });
  }
}
