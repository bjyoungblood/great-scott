'use strict';

import assert from 'assert';
import { format } from 'util';

import _ from 'lodash';
import Promise from 'bluebird';
import squel from 'squel';

import pools from './pools';
import {
  PostgresError,
  NotFoundError
} from './errors';

// Enable extra Postgres features (this is required!).
squel.useFlavour('postgres');

class DataSource {
  constructor(options) {
    assert(options.connectionString, 'options.connectionString is required.');

    this.connectionString = options.connectionString;
    this.idAttribute = options.idAttribute || 'id';
    this.tableName = options.tableName || '';

    this.builder = squel;
  }

  parse(row) {
    return row;
  }

  format(model) {
    return model;
  }

  find(idOrObj) {
    let query = this.builder
      .select()
      .from(this.tableName);

    if (_.isObject(idOrObj)) {
      _.each(idOrObj, (value, attribute) => {
        query = query.where(format('%s = ?', attribute), value);
      });
    } else {
      query = query.where(format('%s = ?', this.idAttribute), idOrObj);
    }

    return this.execute(query)
      .then((result) => {
        if (! result.length) {
          throw new NotFoundError();
        }

        return result[0];
      });
  }

  findAll(where = {}) {
    let query = this.builder
      .select()
      .from(this.tableName);

    if (_.isObject(where)) {
      _.each(where, (value, attribute) => {
        query = query.where(format('%s = ?', attribute), value);
      });
    }

    return this.execute(query);
  }

  insert(model) {
    let fields = _.omit(this.format(model), _.isUndefined);

    let query = this.builder
      .insert()
      .into(this.tableName)
      .setFields(fields)
      .returning('*');

    return this.execute(query)
      .then((result) => {
        return result[0];
      });
  }

  update(model) {
    let fields = _.omit(this.format(model), _.isUndefined);

    _.each(fields, function(value, key) {
      if (_.isUndefined(value)) {
        delete fields[key];
      }
    });

    let query = this.builder
      .update()
      .table(this.tableName)
      .setFields(fields)
      .where(format('%s = ?', this.idAttribute), fields[this.idAttribute])
      .returning('*');

    return this.execute(query)
      .then((result) => {
        return result[0];
      });
  }

  delete(idOrModel) {
    let id;
    if (_.isObject(idOrModel)) {
      id = idOrModel.get(this.idAttribute);
    } else {
      id = idOrModel;
    }

    let query = this.builder
      .delete()
      .from(this.tableName)
      .where(format('%s = ?', this.idAttribute), id);

    return this.execute(query)
      .then(() => true);
  }

  execute(query) {
    return this.execRaw(query).then((results) => {
      return results.rows.map((row) => this.parse(row));
    }).catch((err) => {
      throw PostgresError.factory(err);
    });
  }

  execRaw(query) {
    return Promise.using(this._getClient(), (client) => {
      query = query.toParam();

      return client.queryAsync(query.text, query.values);
    });
  }

  _getClient() {
    let pool = pools.get(this.connectionString);

    return pool.acquireAsync()
      .disposer((client) => {
        pool.release(client);
      });
  }
}

export default DataSource;
