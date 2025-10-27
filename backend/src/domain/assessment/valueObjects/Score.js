const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * Score Value Object
 *
 * Represents a score with validation and grade calculation.
 * Ensures scores are always within valid range (0-100).
 */
class Score extends ValueObject {
  constructor(props) {
    super(props);
  }

  /**
   * Create a Score from a numeric value
   */
  static create(value) {
    if (typeof value !== 'number') {
      throw new ValidationError('Score must be a number', 'score');
    }

    if (value < 0 || value > 100) {
      throw new ValidationError('Score must be between 0 and 100', 'score');
    }

    if (!Number.isFinite(value)) {
      throw new ValidationError('Score must be a finite number', 'score');
    }

    // Round to 2 decimal places
    const rounded = Math.round(value * 100) / 100;

    return new Score({ value: rounded });
  }

  /**
   * Create a zero score
   */
  static zero() {
    return new Score({ value: 0 });
  }

  /**
   * Create a perfect score
   */
  static perfect() {
    return new Score({ value: 100 });
  }

  /**
   * Get the numeric value
   */
  get value() {
    return this._props.value;
  }

  /**
   * Get as percentage (same as value)
   */
  get percentage() {
    return this._props.value;
  }

  /**
   * Calculate letter grade
   */
  get grade() {
    const value = this._props.value;
    if (value >= 90) return 'A';
    if (value >= 80) return 'B';
    if (value >= 70) return 'C';
    if (value >= 60) return 'D';
    return 'F';
  }

  /**
   * Check if passing (60% or above)
   */
  isPassing() {
    return this._props.value >= 60;
  }

  /**
   * Check if excellent (90% or above)
   */
  isExcellent() {
    return this._props.value >= 90;
  }

  /**
   * Add points to score
   */
  add(otherScore) {
    if (!(otherScore instanceof Score)) {
      throw new ValidationError('Can only add Score objects');
    }

    const sum = this._props.value + otherScore.value;
    return Score.create(Math.min(100, sum)); // Cap at 100
  }

  /**
   * Calculate percentage of another score
   */
  percentageOf(maxScore) {
    if (!(maxScore instanceof Score)) {
      throw new ValidationError('maxScore must be a Score object');
    }

    if (maxScore.value === 0) {
      return Score.zero();
    }

    const percentage = (this._props.value / maxScore.value) * 100;
    return Score.create(percentage);
  }

  /**
   * Compare scores
   */
  isGreaterThan(otherScore) {
    if (!(otherScore instanceof Score)) {
      throw new ValidationError('Can only compare with Score objects');
    }
    return this._props.value > otherScore.value;
  }

  isLessThan(otherScore) {
    if (!(otherScore instanceof Score)) {
      throw new ValidationError('Can only compare with Score objects');
    }
    return this._props.value < otherScore.value;
  }

  /**
   * Format for display
   */
  toString() {
    return `${this._props.value.toFixed(1)}%`;
  }

  toJSON() {
    return {
      value: this._props.value,
      percentage: this.percentage,
      grade: this.grade,
      isPassing: this.isPassing()
    };
  }
}

module.exports = Score;
