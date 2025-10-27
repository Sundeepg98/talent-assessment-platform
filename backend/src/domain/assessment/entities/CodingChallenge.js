class CodingChallenge {
  constructor(props) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.testCases = props.testCases || [];
  }
}
module.exports = CodingChallenge;