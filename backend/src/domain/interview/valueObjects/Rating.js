const ValueObject = require('../../shared/ValueObject');
const { ValidationError } = require('../../errors/DomainError');

/**
 * Rating Value Object
 *
 * Represents a rating on a 1-5 scale for interview performance.
 * Ensures ratings are always within valid range.
 */
class Rating extends ValueObject {
  constructor(props) {
    super(props);
  }

  /**
   * Create a Rating from a numeric value (1-5)
   */
  static create(value) {
    if (typeof value !== 'number') {
      throw new ValidationError('Rating must be a number', 'rating');
    }

    if (value < 1 || value > 5) {
      throw new ValidationError('Rating must be between 1 and 5', 'rating');
    }

    if (!Number.isInteger(value)) {
      throw new ValidationError('Rating must be a whole number', 'rating');
    }

    return new Rating({ value });
  }

  /**
   * Predefined ratings
   */
  static poor() {
    return new Rating({ value: 1 });
  }

  static belowAverage() {
    return new Rating({ value: 2 });
  }

  static average() {
    return new Rating({ value: 3 });
  }

  static good() {
    return new Rating({ value: 4 });
  }

  static excellent() {
    return new Rating({ value: 5 });
  }

  /**
   * Get the numeric value
   */
  get value() {
    return this._props.value;
  }

  /**
   * Get text description
   */
  get description() {
    switch (this._props.value) {
      case 1:
        return 'Poor';
      case 2:
        return 'Below Average';
      case 3:
        return 'Average';
      case 4:
        return 'Good';
      case 5:
        return 'Excellent';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get detailed description
   */
  get detailedDescription() {
    switch (this._props.value) {
      case 1:
        return 'Needs significant improvement';
      case 2:
        return 'Below expectations, requires improvement';
      case 3:
        return 'Meets expectations';
      case 4:
        return 'Exceeds expectations';
      case 5:
        return 'Outstanding performance';
      default:
        return 'Unknown';
    }
  }

  /**
   * Convert to percentage (20% per star)
   */
  get asPercentage() {
    return this._props.value * 20;
  }

  /**
   * Get star representation
   */
  get stars() {
    return '★'.repeat(this._props.value) + '☆'.repeat(5 - this._props.value);
  }

  /**
   * Check if passing (3 or above)
   */
  isPassing() {
    return this._props.value >= 3;
  }

  /**
   * Check if excellent (5)
   */
  isExcellent() {
    return this._props.value === 5;
  }

  /**
   * Check if poor (1 or 2)
   */
  isPoor() {
    return this._props.value <= 2;
  }

  /**
   * Compare ratings
   */
  isHigherThan(otherRating) {
    if (!(otherRating instanceof Rating)) {
      throw new ValidationError('Can only compare with Rating objects');
    }
    return this._props.value > otherRating.value;
  }

  isLowerThan(otherRating) {
    if (!(otherRating instanceof Rating)) {
      throw new ValidationError('Can only compare with Rating objects');
    }
    return this._props.value < otherRating.value;
  }

  /**
   * Format for display
   */
  toString() {
    return `${this._props.value}/5 - ${this.description}`;
  }

  toJSON() {
    return {
      value: this._props.value,
      description: this.description,
      detailedDescription: this.detailedDescription,
      percentage: this.asPercentage,
      stars: this.stars,
      isPassing: this.isPassing()
    };
  }
}

module.exports = Rating;
