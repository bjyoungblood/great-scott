'use strict';

import _ from 'lodash';
import pg from 'pg';
import Promise from 'bluebird';
import squel from 'squel';
import { Record as record } from 'immutable';
import assert from 'assert';

// Enable extra Postgres features (this is required!).
squel.useFlavour('postgres');

function DataSource(mixinOptions = {}) {

  // Default database connection string to DATABASE_URL environment variable.
  mixinOptions.connectionStr = mixinOptions.connectionStr || process.env.DATABASE_URL;

  assert(mixinOptions.connectionStr, 'A database connection string is required.');

  mixinOptions.model = mixinOptions.model || record;

  var mixin = {

    builder : squel,

    execute: (query) => {

      return new Promise((resolve, reject) => {

        // Get a connection from the pool
        pg.connect(mixinOptions.connectionStr, (err, client, done) => {

          // Return the connection to the pool and abort when there is a connection error.
          if (err) {
            done();
            reject(err.toString());
            return;
          }

          query = query.toParam();

          // Execute the query
          client.query(query.text, query.values, (err, results) => {

            // Return the connection to the pool and reject with the error message.
            if (err) {
              done();
              reject(err.toString());
              return;
            }

            // Return the connection to the pool
            done();

            var rows = results.rows.map((row) => {
              return new mixinOptions.model(row);
            });

            // Returns the results
            resolve({
              rowCount : results.rowCount,
              rows : rows
            });

          });

        });
      });
    }

  };

  return mixin;
}

export default function CreateDataSource(options = {}) {

  function extendStateSource(dataSource, options) {
    _.extend.apply(_, [dataSource].concat(
      options,
      options.mixins,
      DataSource(options))
    );
  }

  extendStateSource(this, options);

  return this;
}
