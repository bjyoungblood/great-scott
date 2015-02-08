'use strict';

import assert from 'assert';
import { format } from 'util';

import _ from 'lodash';
import Promise from 'bluebird';
import squel from 'squel';
import { Record as record } from 'immutable';

import pools from './pools';
import {
  PostgresError,
  NotFoundError,
} from './errors';

// Enable extra Postgres features (this is required!).
squel.useFlavour('postgres');

class DataSource {
  constructor(options) {
    assert(options.connectionString, 'options.connectionString is required.');

    this.connectionString = options.connectionString;
    this.model = options.model || record;
    this.idAttribute = options.idAttribute || 'id';
    this.tableName = options.tableName || '';

    this.builder = squel;
  }

  parse(row) {
    return new this.model(row);
  }

  format(model) {
    return model.toObject();
  }

  find(id) {
    var query = this.builder
      .select()
      .from(this.tableName)
      .where(format('%s = ?', this.idAttribute), id);

    return this.execute(query)
      .then((result) => {
        if (! result.length) {
          throw new NotFoundError();
        }

        return result[0];
      });
  }

  findAll() {
    var query = this.builder
      .select()
      .from(this.tableName);

    return this.execute(query);
  }

  insert(model) {
    var fields = this.format(model);

    _.each(fields, function(value, key) {
      if (_.isUndefined(value)) {
        delete fields[key];
      }
    });

    var query = this.builder
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
    var fields = this.format(model);

    _.each(fields, function(value, key) {
      if (_.isUndefined(value)) {
        delete fields[key];
      }
    });

    var query = this.builder
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
    var id;
    if (idOrModel instanceof this.model) {
      id = idOrModel.get(this.idAttribute);
    } else {
      id = idOrModel;
    }

    var query = this.builder
      .delete()
      .from(this.tableName)
      .where(format('%s = ?', this.idAttribute), id);

    return this.execute(query)
      .then(() => true);
  }

  execute(query) {
    return Promise.using(this._getClient(), (client) => {
      query = query.toParam();

      return client.queryAsync(query.text, query.values);
    }).then((results) => {
      return results.rows.map((row) => this.parse(row));
    }).catch((err) => {
      throw PostgresError.factory(err);
    });
  }

  _getClient() {
    var pool = pools.get(this.connectionString);

    return pool.acquireAsync()
      .disposer((client) => {
        pool.release(client);
      });
  }
}

export default DataSource;
