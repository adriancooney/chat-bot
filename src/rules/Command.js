import Match from "./Match";

export default class Command extends Match {
    constructor(props, context) {
        const { name } = props;

        super({
            ...props,
            expr: new RegExp(`^\\s*(${name})(?:\\s+|$)`),
            groups: ["command"]
        }, context);
    }

    toString() {
        return `command ${this.props.name}`;
    }
}