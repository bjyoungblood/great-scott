'use strict';

class PostgresError extends Error {
  constructor(message, code) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.code = code;
  }
}

class ForeignKeyConstraintError extends PostgresError {
}

class NotNullConstraintError extends PostgresError {
}

class UniqueConstraintError extends PostgresError {
}

class NotFoundError extends PostgresError {
}

export default {
  PostgresError,
  ForeignKeyConstraintError,
  NotNullConstraintError,
  UniqueConstraintError,
  NotFoundError,
};
