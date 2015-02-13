'use strict';

import Parser from './base';

export default class ToModel extends Parser {
  constructor(model) {
    this.model = model;
  }

  parse(promise) {
    return promise.map((row) => new this.model(row));
  }
}
