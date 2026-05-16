export class TelegramError extends Error {
  constructor(errorCode, description, parameters = {}) {
    super(`[${errorCode}] ${description}`);
    this.name = 'TelegramError';
    this.errorCode = errorCode;
    this.description = description;
    this.parameters = parameters;
    this.retryAfter = parameters.retry_after || null;
  }

  toString() {
    return `[${this.errorCode}] ${this.description}`;
  }
}

export class StopPropagation extends Error {
  constructor() {
    super('StopPropagation');
    this.name = 'StopPropagation';
  }
}
