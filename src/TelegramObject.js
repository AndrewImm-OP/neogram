const FIELD_MAP = {
  from: 'from_user',
  type: 'type_val',
  filter: 'filter_val',
};

const REVERSE_MAP = {
  from_user: 'from',
  type_val: 'type',
  filter_val: 'filter',
};

export class TelegramObject {
  constructor(data = {}) {
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        const mappedKey = FIELD_MAP[key] || key;
        this[mappedKey] = value;
      }
    }
  }

  toJSON() {
    return this.#clean(this);
  }

  #clean(obj) {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof TelegramObject) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) continue;
        const outKey = REVERSE_MAP[key] || key;
        result[outKey] = this.#clean(value);
      }
      return result;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.#clean(item));
    }
    if (typeof obj === 'object' && !(obj instanceof Date)) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) continue;
        result[key] = this.#clean(value);
      }
      return result;
    }
    return obj;
  }

  static fromJSON(data) {
    if (!data || typeof data !== 'object') return null;
    if (Array.isArray(data)) {
      return data.map(item => this.fromJSON(item));
    }
    return new this(data);
  }

  toString() {
    const entries = Object.entries(this)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(', ');
    return `${this.constructor.name}(${entries})`;
  }
}
