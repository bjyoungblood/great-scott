'use strict';

import _ from 'lodash';
import Parser from './base';

export default class CamelCaseAttributes extends Parser {
  parse(promise) {
    return promise.map((row) => {
      return _.transform(row, function(memo, val, key) {
        memo[ _.camelCase(key) ] = val;
        return memo;
      });
    });
  }
}
