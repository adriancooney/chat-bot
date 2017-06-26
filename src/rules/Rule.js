import { inspect } from "util";
import {
    flatten,
    omit,
    isEqualWith,
    isPlainObject
} from "lodash";

const defaultLogger = (message, { indent } = {}) => console.log("  ".repeat(indent) + message);

export default class Rule {
    constructor(props, context = {}) {
        this.props = {
            children: [],
            ...props
        };

        this.state = null;
        this.context = context;
    }

    /** @type {Function} The logger used during debug mode. */
    get logger() {
        return this.context && this.context.logger ? this.context.logger : defaultLogger;
    }

    /**
     * Decide whether this rule matches the inputted message.
     *
     * @return {Boolean}
     */
    match(/* message */) {
        return true;
    }

    /**
     * Convert the rule to string (used when `print`ing).
     *
     * @return {String}
     */
    toString() {
        return "rule";
    }

    /**
     * Set the state of the bot. This triggers a re-render.
     *
     * @param {Object} state The next state.
     */
    async setState(state = {}) {
        this.state = Object.assign({}, this.state, state);

        await this.update();
    }

    async setProps(props) {
        console.log("Setting props", props);
        this.props = Object.assign({}, props);

        if(this.willReceiveProps) {
            await this.willReceiveProps(this.props);
        }

        await this.update();
    }

    async update() {
        if(this.render) {
            this.mount = await Rule.mount(this.render(), Object.assign({}, this.context), this.mount);
        }
    }

    /**
     * Test a message against the current rule and return handlers to execute from matching rules.
     *
     * @param  {Message} message        The input message object.
     * @param  {Boolean} debug          Whether or not to enable debug mode.
     * @param  {Number}  level          The current node depth (private).
     * @return {Promise<Function[]>}    Promise that resolves the matching handlers to execute.
     */
    async test(message, debug, level = 0) {
        const transform = this.match(message);
        const match = transform !== false || typeof transform === "undefined";

        if(match) {
            message = Rule.transform(message, transform);
        }

        if(debug) {
            const shortMessage = message.content.length > 40 ? message.content.slice(0, 40) + "..." : message.content;

            if(level === 0) {
                this.logger(`message: ${shortMessage}`, { indent: level });
            }

            this.logger(`rule: ${this.toString()} = ${match ? "pass" : "fail"}${this.props.handler ? "*" : ""} ("${shortMessage}")`, { indent: level });
        }

        if(!match) {
            return;
        }

        if(Array.isArray(this.mount)) {
            const matches = [];
            for(let i = 0; i < this.mount.length; i++) {
                const child = this.mount[i];
                const childMatch = await child.test(message, debug, level + 1);

                if(childMatch) {
                    if(this.any !== true) {
                        return childMatch;
                    }

                    matches.push(childMatch);
                }
            }

            return flatten(matches);
        } else if(this.mount) {
            return this.mount.test(message, debug, level + 1);
        } else {
            const handler = this.props.handler;

            if(handler) {
                // We bind the message object to the handler so any transforms
                // applied by the rules are persisted.
                return [ handler.bind(null, message) ];
            } else {
                return [];
            }
        }
    }

    /**
     * Print a mounted rule tree.
     *
     * @param  {Number} level The current tree depth (private).
     * @return {String}       The formatted tree.
     */
    print(level = 0) {
        const ws = level > 0 ? "| ".repeat(level) : "";
        let output = this.toString();

        if(this.props.handler && !this.mount) {
            output = "if " + output + " do " + inspect(this.props.handler);
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
     * Create a new rule descriptor tree.
     *
     * @param  {Function}    rule     Rule contsructor.
     * @param  {Object}      props    Rule props (optional).
     * @param  {...Object}   children Child rule descriptors.
     * @return {Object}               Rule descriptor tree.
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

        // Flatten children to allow passing in arrays of arrays
        children = flatten(children).filter(isPlainObject);

        if(children.length) {
            if(props.handler) {
                throw new Error("Rule cannot have an handler and children.");
            }
        }

        return {
            type: rule,
            props: Object.assign(props, { children })
        };
    }

    /**
     * Mount a rule descriptor tree.
     *
     * @param  {Object} tree         Rule descriptor tree (See Rule.create).
     * @param  {Object} context      Optional context to be implicitly passed to child rules.
     * @param  {Rule}   currentMount The current mount to diff.
     * @return {Rule}                Returns an instance of the root node in the rule descriptor tree.
     */
    static async mount(tree, context = {}, currentMount) {
        if(tree === null) {
            return null;
        }

        let inst;
        if(currentMount instanceof Rule && tree.type === currentMount.tree.type) {
            inst = Object.assign(currentMount, {
                props: tree.props,
                tree
            });
        } else {
            inst = new tree.type(tree.props, context);

            if(currentMount && currentMount.onUnmount) {
                await currentMount.onUnmount.call(currentMount);
            }
        }

        const childContext = Object.assign({}, context);

        let mount;
        if(inst.render) {
            const rendered = inst.render();

            if(rendered !== null && (!isPlainObject(rendered) || !rendered.type)) {
                throw new Error("render method must return a valid rule.");
            }

            mount = await Rule.mount(rendered, childContext, currentMount ? currentMount.mount : null);
        } else if(tree.props.children && tree.props.children.length) {
            mount = await Promise.all(tree.props.children.map((subtree, i) => {
                const mount = currentMount && Array.isArray(currentMount.mount)
                    ? currentMount.mount.find(submount => {
                        return subtree.props.key && submount.props.key && submount.props.key === subtree.props.key;
                    }) || currentMount.mount[i]
                    : null;

                return Rule.mount(subtree, childContext, mount);
            }));
        } else {
            mount = null;
        }

        Object.assign(inst, { context, tree, mount });

        if(inst.onMount) {
            await inst.onMount();
        }

        return inst;
    }

    /**
     * Apply a transform to a message. A transform is a value returned from the `match` method.
     *
     * @param  {Object}         message     The input message object.
     * @param  {String|Object}  transform   The string or object transform.
     * @return {Object}                     The transform message object.
     */
    static transform(message, transform) {
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

        return message;
    }
}