import Match from "./Match";

export default class Mention extends Match {
    constructor(props) {
        let { handle, anywhere, symbol } = props;

        if(!symbol) {
            symbol = "@";
        }

        super({
            ...props,
            expr: new RegExp(`^\\s*${symbol}${handle}\\s+`)
        });
    }

    toString() {
        return `mention @${this.props.handle}`;
    }
}