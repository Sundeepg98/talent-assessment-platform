/**
 * Base Entity Class - DDD Building Block
 * Entities have identity that persists over time
 */
class Entity {
  constructor(id) {
    if (!id) {
      throw new Error('Entity must have an ID');
    }
    this._id = id;
    this._domainEvents = [];
  }

  get id() {
    return this._id;
  }

  equals(entity) {
    if (!entity || !(entity instanceof Entity)) {
      return false;
    }
    return this._id === entity._id;
  }

  addDomainEvent(event) {
    this._domainEvents.push({
      ...event,
      aggregateId: this._id,
      occurredOn: new Date()
    });
  }

  clearEvents() {
    this._domainEvents = [];
  }

  get domainEvents() {
    return this._domainEvents;
  }

  /**
   * Validate entity invariants
   * Override in child classes
   */
  validate() {
    // To be implemented by subclasses
  }
}

module.exports = Entity;