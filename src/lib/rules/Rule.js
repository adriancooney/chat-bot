export default class Rule {
    constructor(props) {
        this.props = props;
    }

    match() {
        throw new Error("Cannot match with base rule.");
    }

    inspect() {
        return "undefined rule"
    }
}