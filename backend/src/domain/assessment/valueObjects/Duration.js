const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * Duration Value Object
 *
 * Represents a time duration for assessments, interviews, etc.
 * Provides conversion between different time units and expiration checking.
 */
class Duration extends ValueObject {
  constructor(props) {
    super(props);
  }

  /**
   * Create from minutes
   */
  static fromMinutes(minutes) {
    if (typeof minutes !== 'number') {
      throw new ValidationError('Duration must be a number', 'duration');
    }

    if (minutes <= 0) {
      throw new ValidationError('Duration must be positive', 'duration');
    }

    if (!Number.isFinite(minutes)) {
      throw new ValidationError('Duration must be a finite number', 'duration');
    }

    return new Duration({ minutes });
  }

  /**
   * Create from hours
   */
  static fromHours(hours) {
    if (typeof hours !== 'number' || hours <= 0) {
      throw new ValidationError('Hours must be a positive number', 'duration');
    }

    return Duration.fromMinutes(hours * 60);
  }

  /**
   * Create from seconds
   */
  static fromSeconds(seconds) {
    if (typeof seconds !== 'number' || seconds <= 0) {
      throw new ValidationError('Seconds must be a positive number', 'duration');
    }

    return Duration.fromMinutes(seconds / 60);
  }

  /**
   * Create from milliseconds
   */
  static fromMilliseconds(milliseconds) {
    if (typeof milliseconds !== 'number' || milliseconds <= 0) {
      throw new ValidationError('Milliseconds must be a positive number', 'duration');
    }

    return Duration.fromMinutes(milliseconds / 60000);
  }

  /**
   * Common durations
   */
  static oneMinute() {
    return Duration.fromMinutes(1);
  }

  static fifteenMinutes() {
    return Duration.fromMinutes(15);
  }

  static thirtyMinutes() {
    return Duration.fromMinutes(30);
  }

  static oneHour() {
    return Duration.fromHours(1);
  }

  static twoHours() {
    return Duration.fromHours(2);
  }

  /**
   * Get duration in different units
   */
  get minutes() {
    return this._props.minutes;
  }

  get hours() {
    return this._props.minutes / 60;
  }

  get seconds() {
    return this._props.minutes * 60;
  }

  get milliseconds() {
    return this._props.minutes * 60 * 1000;
  }

  /**
   * Check if time has expired since a start time
   */
  hasExpired(startTime) {
    if (!(startTime instanceof Date)) {
      throw new ValidationError('startTime must be a Date object');
    }

    const now = new Date();
    const elapsed = now - startTime;
    return elapsed > this.milliseconds;
  }

  /**
   * Calculate remaining time from a start time
   */
  getRemainingTime(startTime) {
    if (!(startTime instanceof Date)) {
      throw new ValidationError('startTime must be a Date object');
    }

    const now = new Date();
    const elapsed = now - startTime;
    const remaining = this.milliseconds - elapsed;

    if (remaining <= 0) {
      return Duration.fromMilliseconds(1); // Minimum 1ms
    }

    return Duration.fromMilliseconds(remaining);
  }

  /**
   * Get expiration date from a start time
   */
  getExpirationDate(startTime) {
    if (!(startTime instanceof Date)) {
      throw new ValidationError('startTime must be a Date object');
    }

    return new Date(startTime.getTime() + this.milliseconds);
  }

  /**
   * Compare durations
   */
  isLongerThan(otherDuration) {
    if (!(otherDuration instanceof Duration)) {
      throw new ValidationError('Can only compare with Duration objects');
    }
    return this._props.minutes > otherDuration.minutes;
  }

  isShorterThan(otherDuration) {
    if (!(otherDuration instanceof Duration)) {
      throw new ValidationError('Can only compare with Duration objects');
    }
    return this._props.minutes < otherDuration.minutes;
  }

  /**
   * Add durations
   */
  add(otherDuration) {
    if (!(otherDuration instanceof Duration)) {
      throw new ValidationError('Can only add Duration objects');
    }

    return Duration.fromMinutes(this._props.minutes + otherDuration.minutes);
  }

  /**
   * Multiply duration
   */
  multiply(factor) {
    if (typeof factor !== 'number' || factor <= 0) {
      throw new ValidationError('Factor must be a positive number');
    }

    return Duration.fromMinutes(this._props.minutes * factor);
  }

  /**
   * Format for display
   */
  toString() {
    const hours = Math.floor(this._props.minutes / 60);
    const minutes = Math.floor(this._props.minutes % 60);

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  /**
   * Format as human-readable string
   */
  toHumanReadable() {
    const hours = Math.floor(this._props.minutes / 60);
    const minutes = Math.floor(this._props.minutes % 60);

    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }

  toJSON() {
    return {
      minutes: this.minutes,
      hours: this.hours,
      seconds: this.seconds,
      display: this.toString()
    };
  }
}

module.exports = Duration;
