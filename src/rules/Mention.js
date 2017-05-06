import Match from "./Match";

export default class Mention extends Match {
    constructor({ handle, anywhere, symbol }) {
        if(!symbol) {
            symbol = "@";
        }

        super({ handle, anywhere, symbol, expr: new RegExp(`^\\s*${symbol}${handle}\\s+`) });
    }

    inspect() {
        return `mention @${this.props.handle}`;
    }
}