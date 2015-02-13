'use strict';

import _ from 'lodash';
import Joi from 'joi';
import { Record as record } from 'immutable';

import Parser from '../parsers/base';
import Formatter from '../formatters/base';
import { ShortCircuitError } from '../errors';

const optionsSchema = Joi.object().keys({
  model : Joi.func().optional().default(record({})),
  idAttribute : Joi.string().optional().default('id'),
  parsers : Joi.array().includes(
    Joi.object().type(Parser)
  ).optional().default([]),
  formatters : Joi.array().includes(
    Joi.object().type(Formatter)
  ).optional().default([]),
}).unknown();

class DataSource {
  constructor(options, extraValidation = {}) {
    let schema = optionsSchema;

    if (extraValidation) {
      schema = schema.concat(extraValidation);
    }

    let validate = Joi.validate(options, schema);

    if (validate.error) {
      throw validate.error;
    }

    this.options = validate.value;

    this.model = this.options.model;
    this.idAttribute = this.options.idAttribute;
    this.parsers = this.options.parsers;
    this.formatters = this.options.formatters;

    this.relationships = {};
  }

  _addParsers(promise) {
    _.each(this.parsers, function(parser) {
      promise = parser.parse(promise);
    });

    return promise
      .catch(ShortCircuitError, function(err) {
        return err.payload;
      });
  }

  _addFormatters(promise) {
    _.each(this.formatters, function(formatter) {
      promise = formatter.format(promise);
    });

    return promise;
  }
}

export default DataSource;
