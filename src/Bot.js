import { inspect } from "util";
import Promise from "bluebird";
import { flatten } from "lodash";

export default class Bot {
    constructor(props) {
        this.props = props;
        this.queue = [];
        this.debug = true;
    }

    /**
     * Handle an incoming message and pass it through the decision tree. If an
     * action is returned, execute the action (or dispatch).
     *
     * @param  {Object} message Message object. See message object spec.
     * @return {Promise}        Resolves when the action completes.
     */
    handleMessage(message) {
        if(!this.router) {
            this.setState(this.state);
        }

        const action = this.router(message, this.debug);

        if(action) {
            if(action.length === 2) {
                return this.dispatch(action(message));
            } else {
                return Promise.resolve(action(this.state, this.dispatch.bind(this)));
            }
        }
    }

    /**
     * Dispatch an FSA (Flux Standard Action) or alternatively supply your own
     * object action as the first parameter.
     *
     * @param  {String} type    The action type.
     * @param  {Object} payload The action payload.
     * @return {Promise}        Resolves when the state has been reduced and all transitions are complete.
     */
    dispatch(type, payload) {
        const action = typeof type === "object" ? type : { type, payload };

        if(this.transitioning) {
            return new Promise((resolve, reject) => this.queue.unshift({ action, resolve, reject }));
        }

        const mutations = [];
        const nextState = this.reduce(this.state, action, (type, payload = action.payload) => mutations.push({ type, payload }));
        return this.transitioning = Promise.mapSeries(mutations, this.transition.bind(this, action, this.state, nextState)).then(() => {
            this.transitioning = null;
            this.setState(nextState);

            if(this.queue.length) {
                const { action, resolve, reject } = this.queue.pop();
                this.dispatch(action).then(reject, resolve);
            }

            return null;
        });
    }

    /**
     * Set the state of the bot. This triggers a re-render.
     *
     * @param {Object} state The next state.
     */
    setState(state) {
        this.state = state;
        this.router = this.render();
    }

    /**
     * A no-op transition.
     */
    transition(action, currentState, nextState, mutation) {
        return;
    }

    sendMessage({ to, content })  {
        return Promise.resolve();
    }

    toJSON() {
        return this.state;
    }

    /** {Function} The debug logger. */
    static logger = (...args) => console.log(...args);

    /**
     * Create a new matcher from a rule.
     * @param  {Constructor}    rule     A rule constructor.
     * @param  {Object}         props    The rule's props.
     * @param  {...Function}    children Nested matchers returned from `Bot.rule`.
     * @return {Function} Returns a matcher.
     */
    static rule(rule, props, ...children) {
        const inst = new rule(props, children);
        let action = props.action || props.handler;

        if(!children.length && !action) {
            throw new Error("Leaf matchers must have an action.");
        }

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

        const matcher = Object.assign((message, debug, level = 0) => {
            let transform = inst.match(message);
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
                    Bot.logger(indent + "message: ", message);
                }

                Bot.logger(indent + `rule: ${inst.inspect()} = ${match ? "pass" : "fail"}`, `"${message.content}"`);
            }

            if(match && props && action) {
                if(props.transform) {
                    return (...args) => action(props.transform(message), ...args);
                }

                // We bind the message object to the action handler so any transforms
                // applied by the rules are persisted.
                return action.bind(null, message);
            } else if(match && children.length) {
                for(var i = 0, len = children.length; i < len; i++) {
                    const child = children[i];
                    const childMatch = child(message, debug, level + 1);

                    if(childMatch) {
                        return childMatch;
                    }
                }
            } else {
                return null;
            }
        }, { props, children, inst, rule });

        matcher.inspect = Bot.inspectRule.bind(null, matcher, 0);
        matcher.toString = inst.inspect.bind(inst);

        return matcher;
    }


    /**
     * Inspect an instantiated rule (i.e. matcher).
     * @param  {Function} matcher Matcher returned from `Bot.rule`.
     * @param  {Number}   level   How deep the rule is nested (internal).
     * @return {String}           The string to display.
     */
    static inspectRule(matcher, level = 0) {
        const ws = level > 0 ? "  ".repeat(level) : "";
        let output = inspect(matcher.inst);

        if(matcher.props && matcher.props.action) {
            const action = matcher.props.action;
            output = "if " + output + " do " + inspect(action);
        }

        output = ws + output;

        if(matcher.children) {
            output += "\n" + matcher.children.map(child => Bot.inspectRule(child, level + 1)).join("");
        }

        return output;
    }
}