import Match from "./Match";

export default class Command extends Match {
    constructor(props) {
        const { name } = props;

        super({
            ...props,
            expr: new RegExp(`\\s*${name}(?:\\s+|$)`)
        });
    }

    toString() {
        return `command ${this.props.name}`;
    }
}