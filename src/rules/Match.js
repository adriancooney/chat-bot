import Rule from "./Rule";

export default class Match extends Rule {
    match({ content, ...attrs }) {
        const { exactly, expr } = this.props;

        if(typeof exactly !== "undefined") {
            exactly = exactly.toString();
            return content.startsWith(exactly) ? content.slice(exactly.length) : false;
        } else if(expr) {
            const match = content.match(expr);
            return match ? content.slice(match[0].length) : false;
        }
    }

    toString() {
        return `match ${this.props.exactly ? "exactly " : ""}${inspect(this.props.exactly || this.props.expr)}`;
    }
}