import { inspect } from "util";

export default class Rule {
    constructor(props) {
        this.props = {
            children: [],
            ...props
        };
    }

    match() {
        throw new Error("Cannot match with base rule.");
    }

    toString() {
        return "undefined rule"
    }

    /** {Function} The debug logger. */
    static logger = (...args) => console.log(...args);

    test(message, debug, level = 0) {
        let transform = this.match(message);
        let match = transform !== false;

        if(typeof transform === "string") {
            transform = { content: transform };
        }

        if(typeof transform !== "object") {
            transform = null;
        }

        if(transform) {
            // Apply the transform to the message for all children
            message = Object.assign({}, message, transform);
        }

        if(debug) {
            const indent = "  ".repeat(level);

            if(level === 0) {
                Rule.logger(indent + "message: ", message);
            }

            Rule.logger(indent + `rule: ${this.toString()} = ${match ? "pass" : "fail"}`, `"${message.content}"`);
        }

        const action = this.props.action;

        if(match && action) {
            if(this.props.transform) {
                return (...args) => action(this.props.transform(message), ...args);
            }

            // We bind the message object to the action handler so any transforms
            // applied by the rules are persisted.
            return action.bind(null, message);
        } else if(match && this.props.children.length) {
            for(var i = 0, len = this.props.children.length; i < len; i++) {
                const child = this.props.children[i];
                const childMatch = child.test(message, debug, level + 1);

                if(childMatch) {
                    return childMatch;
                }
            }
        } else if(match && this.router) {
            return this.router.test(message, debug, level + 1);
        } else {
            return null;
        }
    }

    inspect(level) {
        const ws = level > 0 ? "  ".repeat(level) : "";
        let output = this.toString();

        if(this.props.action) {
            output = "if " + output + " do " + inspect(this.props.action) + "\n";
        }

        output = ws + output;

        if(this.props.children.length) {
            output += "\n" + this.props.children.map(child => child.inspect(level + 1)).join("");
        } else if(this.router) {
            output += "\n" + this.router.inspect(level + 1);
        }

        return output;
    }
}