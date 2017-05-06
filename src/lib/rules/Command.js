import Match from "./Match";

export default class Command extends Match {
    constructor({ name }) {
        super({
            name,
            expr: new RegExp(`\\s*${name}(?:\\s+|$)`)
        });
    }

    inspect() {
        return `command ${this.props.name}`;
    }
}