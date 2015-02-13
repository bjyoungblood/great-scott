'use strict';

import _ from 'lodash';
import { pluralize } from 'inflection';

export default class Base {
  constructor(baseMapper, options = {}) {

    this.baseMapper = baseMapper;
    this.options = options;
    this.model  = options.model;
    this.tableName = options.tableName;
    this.nearKey = options.nearKey;
    this.farKey = options.farKey;
    this.required = options.required;

    if (! this.tableName && this.model.modelName) {
      this.tableName = pluralize(this.model.modelName).toLowerCase();
    }

    this.alias = _.uniqueId(this.tableName + '_');
  }

  addToQuery() {
    throw new Error('Missing implementation');
  }
}
