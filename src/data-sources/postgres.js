'use strict'

import _ from 'lodash';
import { format } from 'util';
import squel from 'squel'
import Joi from 'joi';
import Promise from 'bluebird';

import BaseDataSource from './base';

import pools from '../pool/postgres';
import {
  PostgresError,
  NotFoundError,
  ShortCircuitError,
} from '../errors';

const optionsSchema = Joi.object().keys({
  connectionString : Joi.string().required(),
  tableName : Joi.string().required(),
}).unknown();

export default class PostgresDataSource extends BaseDataSource {
  constructor(options) {
    super(options, optionsSchema);

    this.tableName = this.options.tableName;
    this.pool = pools.get(this.options.connectionString);

    this.builder = squel.useFlavour('postgres');
  }

  fetch(query, options = {}) {
    if (options.withRelated) {
      let field = format('row_to_json(%s.*) %s', this.tableName, this.tableName);
      query = query.field(field);

      _.each(options.withRelated, (relationship) => {
        query = this.relationships[relationship].addToQuery(
          query,
          this.tableName
        );
      });
    }

    return this.execute(query, options.withRelated);
  }

  execute(query, withRelated) {
    let result = Promise.using(this._getClient(), (client) => {
      let params = query.toParam();
      return client.queryAsync(params.text, params.values);
    }).then((resultset) => {
      resultset._related = withRelated;
      return resultset;
    });

    return this._addParsers(result);
  }

  _getClient() {
    return this.pool.acquireAsync()
      .disposer((client) => {
        this.pool.release(client);
      });
  }
}
