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
    static logger = (message, level) => console.log("  ".repeat(level) + message);

    async test(message, debug, level = 0) {
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
            if(level === 0) {
                Rule.logger("message: " + inspect(message), level);
            }

            Rule.logger(`rule: ${this.toString()} = ${match ? "pass" : "fail"} "${message.content}"`, level);
        }

        const action = this.props.action;

        if(!match) {
            return Promise.resolve();
        }

        if(action) {
            if(this.props.transform) {
                return Promise.resolve([ (...args) => action(this.props.transform(message), ...args) ]);
            }

            // We bind the message object to the action handler so any transforms
            // applied by the rules are persisted.
            return Promise.resolve([ action.bind(null, message) ]);
        }

        if(this.props.children.length) {
            const matches = [];
            for(var i = 0, len = this.props.children.length; i < len; i++) {
                const child = this.props.children[i];
                const childMatch = await child.test(message, debug, level + 1);

                if(childMatch) {
                    if(!this.props.any) {
                        return Promise.resolve(childMatch);
                    }

                    matches.push(childMatch);
                }
            }

            if(matches.length) {
                return Promise.resolve(flatten(matches));
            }
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