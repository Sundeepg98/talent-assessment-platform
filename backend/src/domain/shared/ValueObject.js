/**
 * Base Value Object Class - DDD Building Block
 * Value objects are immutable and compared by value
 */
class ValueObject {
  constructor(props) {
    this._props = Object.freeze(props);
  }

  equals(vo) {
    if (!vo || !(vo instanceof ValueObject)) {
      return false;
    }
    return JSON.stringify(this._props) === JSON.stringify(vo._props);
  }

  get value() {
    return this._props;
  }

  /**
   * Create a new instance with updated props
   */
  with(updates) {
    return new this.constructor({ ...this._props, ...updates });
  }

  toString() {
    return JSON.stringify(this._props);
  }
}

module.exports = ValueObject;