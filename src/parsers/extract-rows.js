'use strict';

import Parser from './base';

export default class ExtractRows extends Parser {
  parse(promise) {
    return promise.then((resultset) => resultset.rows);
  }
}
