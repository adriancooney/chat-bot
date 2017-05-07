import { inspect } from "util";
import { flatten } from "lodash";

export default class Rule {
    constructor(props) {
        this.props = {
            children: [],
            any: false,
            ...props
        };
    }

    match() {
        throw new Error("Rule `match` function is not defined.");
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

        if(!match) {
            return null;
        }

        if(action) {
            if(this.props.transform) {
                return (...args) => action(this.props.transform(message), ...args);
            }

            // We bind the message object to the action handler so any transforms
            // applied by the rules are persisted.
            return action.bind(null, message);
        }

        if(this.props.children.length) {
            const matches = [];
            for(var i = 0, len = this.props.children.length; i < len; i++) {
                const child = this.props.children[i];
                const childMatch = child.test(message, debug, level + 1);

                if(childMatch) {
                    if(!this.props.any) {
                        return [childMatch];
                    }

                    matches.push(childMatch);
                }
            }

            if(matches.length) {
                return flatten(matches);
            }
        }

        if(this.router) {
            return this.router.test(message, debug, level + 1);
        }
    }

    inspect() {
        return this.print();
    }

    print(level = 0) {
        const ws = level > 0 ? "  ".repeat(level) : "";
        let output = this.toString();

        if(this.props.action) {
            output = "if " + output + " do " + inspect(this.props.action);
        }

        output = ws + output + "\n"

        if(this.props.children.length) {
            output += this.props.children.map(child => child.print(level + 1)).join("");
        } else if(this.router) {
            output += this.router.print(level + 1);
        }

        return output;
    }
}