'use strict';

import _ from 'lodash';
import { format } from 'util';
import { singularize } from 'inflection';

import Relationship from './relationship';

export default class HasOne extends Relationship {
  constructor(...args) {
    super(...args);

    if (! this.nearKey) {
      this.nearKey = 'id';
    }

    if (! this.farKey) {
      this.farKey = singularize(this.baseMapper.tableName) + '_id'
    }
  }
  addToQuery(query) {

    let cond = format(
      '%s.%s = %s.%s',
      this.baseMapper.tableName,
      this.nearKey,
      this.alias,
      this.farKey
    );

    let method = this.required ? 'join' : 'left_join';

    query[method](this.tableName + ' ' + this.alias, '', cond);

    let field = format('row_to_json(%s.*) %s', this.alias, this.alias);
    query.field(field);
    return query;
  }
}
