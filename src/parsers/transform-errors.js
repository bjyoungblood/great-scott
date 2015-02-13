'use strict';

import Parser from './base';
import {
  PostgresError
} from '../errors';

export default class TransformErrors extends Parser {
  parse(promise) {
    return promise.catch((err) => {
      throw PostgresError.factory(err);
    });
  }
}
