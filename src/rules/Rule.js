import { inspect } from "util";
import { flatten, omit } from "lodash";

export default class Rule {
    constructor(props, context = {}) {
        this.props = {
            children: [],
            any: false,
            ...props
        };

        this.children = [];
        this.context = context;
    }

    match() {
        throw new Error("Rule `match` function is not defined.");
    }

    toString() {
        return "undefined rule";
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
            const shortMessage = message.content.length > 40 ? message.content.slice(0, 40) + "..." : message.content;

            if(level === 0) {
                Rule.logger(`message: ${shortMessage}`, level);
            }

            Rule.logger(`rule: ${this.toString()} = ${match ? "pass" : "fail"}${this.props.action ? "*" : ""} ("${shortMessage}")`, level);
        }

        const action = this.props.action;

        if(!match) {
            return Promise.resolve();
        }

        if(action) {
            if(this.props.transform) {
                return Promise.resolve([ (message, ...args) => action(this.props.transform(message), ...args) ]);
            }

            // We bind the message object to the action handler so any transforms
            // applied by the rules are persisted.
            return Promise.resolve([ action ]);
        }

        if(this.children.length) {
            const matches = [];
            for(var i = 0, len = this.children.length; i < len; i++) {
                const child = this.children[i];
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

        if(this.children.length) {
            output += this.children.map(child => child.print(level + 1)).join("");
        } else if(this.router) {
            output += this.router.print(level + 1);
        }

        return output;
    }

    /**
     * Create a new matcher from a rule.
     * @param  {Constructor}    rule     A rule constructor.
     * @param  {Object}         props    The rule's props.
     * @param  {...Function}    children Nested matchers returned from `Bot.rule`.
     * @return {Function} Returns a matcher.
     */
    static create(rule, props, ...children) {
        if(!props) {
            props = {};
        }

        let action = props.action || props.handler;

        // if(!(rule.prototype instanceof Bot) && !children.length && !action) {
        //     throw new Error("Leaf matchers must have an action.");
        // }

        if(typeof action === "string") {
            action = message => ({ type: props.action, payload: message });
        }

        if(typeof action === "object") {
            action = () => (props.action);
        }

        if(children.length) {
            if(action) {
                throw new Error("Rule cannot have an action and children.");
            }

            // Flatten children to allow passing in arrays of arrays
            children = flatten(children);
        }

        return {
            type: rule,
            children,
            props: {
                ...omit(props, "action", "handler"),
                action,
                children
            }
        };
    }

    static mount(rule, context = {}) {
        const inst = new rule.type(rule.props, context);

        // Convienance assignment
        inst.context = context;

        if(rule.children.length) {
            inst.children = rule.children.map(child => {
                return Rule.mount(child, Object.assign({}, inst.context));
            });
        }

        if(typeof inst.initialize === "function") {
            inst.initialize();
        }

        return inst;
    }
}