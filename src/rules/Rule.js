import { inspect } from "util";
import {
    flatten,
    omit,
    isEqual,
    isPlainObject
} from "lodash";

export default class Rule {
    constructor(props, context = {}) {
        this.props = {
            children: [],
            any: false,
            ...props
        };

        this.state = null;
        this.children = [];
        this.context = context;
    }

    match() {
        return true;
    }

    toString() {
        return "rule";
    }

    /**
     * Set the state of the bot. This triggers a re-render.
     *
     * @param {Object} state The next state.
     */
    setState(state = {}) {
        this.state = Object.assign({}, this.state, state);

        if(this.render) {
            this.tree = this.render();
            this.mount = Rule.mount(this.tree, this.context, this.mount);
        }
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

        if(this.mount) {
            if(Array.isArray(this.mount)) {
                output += this.mount.map(child => child.print(level + 1)).join("");
            } else {
                output += this.mount.print(level + 1);
            }
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
        if(rule === null) {
            return null;
        }

        if(typeof rule !== "function") {
            throw new Error("Rule must be a function.");
        }

        if(!props) {
            props = {};
        }

        let action = props.action || props.handler;

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
            children = flatten(children).filter(isPlainObject);
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

    static mount(tree, context = {}, currentMount) {
        if(tree === null) {
            return null;
        }

        if(currentMount && currentMount.tree.type === tree.type && isEqual(tree, currentMount.tree)) {
            return currentMount;
        }

        const inst = new tree.type(tree.props, context);
        const childContext = Object.assign({}, context);

        let mount;
        if(inst.render) {
            const rendered = inst.render();

            if(!isPlainObject(rendered) && rendered.type) {
                throw new Error("render method must return a valid rule.");
            }

            mount = Rule.mount(rendered, childContext, currentMount ? currentMount.mount : null);
        } else if(tree.children) {
            mount = tree.children.map((subtree, i) => {
                return Rule.mount(subtree, childContext, currentMount && Array.isArray(currentMount.mount) ? currentMount.mount[i] : null);
            });
        }

        Object.assign(inst, { context, tree, mount });

        if(typeof inst.initialize === "function") {
            inst.initialize();
        }

        return inst;
    }
}