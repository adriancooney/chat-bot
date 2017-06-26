import { inspect } from "util";
import Rule from "./Rule";

export default class Match extends Rule {
    match({ content, ...attrs }) {
        const { exactly, expr, groups } = this.props;

        if(typeof exactly !== "undefined") {
            exactly = exactly.toString();

            return content.startsWith(exactly) ? {
                content: content.slice(exactly.length),
                exactly
            } : false;
        } else if(expr) {
            const match = content.match(expr);

            if(match) {
                const transform = {
                    content: content.slice(match.index + match[0].length)
                };

                if(groups) {
                    groups.reduce((transform, group, i) => Object.assign(transform, {
                        [group]: match[i + 1]
                    }), transform);
                }

                return transform;
            } else {
                return false;
            }
        }
    }

    render() {
        return this.props.children && this.props.children.length ? <Rule>{ this.props.children }</Rule> : null;
    }

    toString() {
        return `match ${this.props.exactly ? "exactly " : ""}${inspect(this.props.exactly || this.props.expr)}`;
    }
}