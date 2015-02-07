'use strict';

import Promise from 'bluebird';
import pg from 'pg';
import { Pool } from 'generic-pool';

Promise.promisifyAll(pg.Client.prototype);

var pools = {};

export default {
  get : function(connectionString, config) {
    config = config || {};
    if (! pools[connectionString]) {
      var pool = Pool({
        name : connectionString,
        create : function(callback) {
          var client = new pg.Client(connectionString);

          client.on('connect', function(err) {
            callback(err, client);
          });

          client.connect();
        },

        destroy : function(client) {
          client.end();
        },

        max : config.max || 10,
        min : config.min || 2,
        idleTimeoutMillis : config.idleTimeoutMillis || 30000,
      });

      Promise.promisifyAll(pool);

      pools[connectionString] = pool;
    }

    return pools[connectionString];
  }
};
