import Rule from "./Rule";
import Match from "./Match";

export default class Mention extends Rule {
    constructor(props, context) {
        super(props, context);

        if(!props.handle && !context.service.user.handle) {
            throw new Error("Please specify a handle to match.");
        }
    }

    render() {
        const handle = this.props.handle || this.context.service.user.handle;
        let symbol = this.props.symbol;

        if(!symbol) {
            symbol = "@";
        }

        return (
            <Match expr={new RegExp(`^\\s*${symbol}${handle}\\s+`)} handler={this.props.handler}>
                { this.props.children }
            </Match>
        );
    }

    getHandle() {
        return this.props.handle || this.context.handle;
    }

    toString() {
        return `mention @${this.props.handle || this.context.service.user.handle}`;
    }
}