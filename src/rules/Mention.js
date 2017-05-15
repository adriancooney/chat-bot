import Match from "./Match";

export default class Mention extends Match {
    constructor(props, context) {
        let { anywhere, symbol } = props;
        const handle = props.handle || context.user.handle;

        if(!symbol) {
            symbol = "@";
        }

        if(!handle) {
            throw new Error("Please specify a handle to match.");
        }

        super({
            ...props,
            expr: new RegExp(`^\\s*${symbol}${handle}\\s+`)
        }, context);
    }

    getHandle() {
        return this.props.handle || this.context.handle;
    }

    toString() {
        return `mention @${this.props.handle || this.context.user.handle}`;
    }
}