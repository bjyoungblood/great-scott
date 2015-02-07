'use strict';

import assert from 'assert';
import { format } from 'util';

import _ from 'lodash';
import Promise from 'bluebird';
import squel from 'squel';
import { Record as record } from 'immutable';

import pools from './pools';
import {
  ForeignKeyConstraintError,
  NotNullConstraintError,
  UniqueConstraintError,
} from './errors';

const DUP_KEY = /^duplicate key value violates unique constraint/i;
const NOT_NULL = /^null value in column ".*" violates not-null constraint$/i;
const FOREIGN_KEY = /^insert or update on table ".*" violates foreign key constraint/;

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
      .from(this.tableName);

    return this.execute(query);
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
      .where(format('%s = ?', this.idAttribute), fields[idAttribute])
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
    }).catch(function(err) {
      if (err.message.match(DUP_KEY)) {
        var newErr = new UniqueConstraintError(err.message, err.code);
        newErr.detail = err.detail;
        newErr.table = err.table;
        newErr.constraint = err.constraint;
        throw newErr;
      } else if (err.message.match(NOT_NULL)) {
        var newErr = new NotNullConstraintError(err.message, err.code);
        newErr.detail = err.detail;
        newErr.table = err.table;
        newErr.column = err.column;
        throw newErr;
      } else if (err.message.match(FOREIGN_KEY)) {
        var newErr = new ForeignKeyConstraintError(err.message, err.code);
        newErr.detail = err.detail;
        newErr.table = err.table;
        newErr.column = err.column;
        newErr.constraint = err.constraint;
        throw newErr;
      }

      throw err;
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
