import { inspect } from "util";
import Promise from "bluebird";
import { flatten, omit } from "lodash";
import Rule from "./rules/Rule";

export default class Bot extends Rule {
    constructor(props) {
        super(props);
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
    async handleMessage(message, debug, level) {
        if(!this.router) {
            this.initialize();
        }

        const actions = await this.router.test(message, debug || this.debug, level);

        if(actions) {
            return Promise.mapSeries(actions, action => {
                action = action(message);

                if(action && !action.then && typeof action === "object" && action.type) {
                    return this.dispatch(action);
                } else return action;
            })
        } else {
            return Promise.resolve();
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

        if(this.state === nextState) {
            return Promise.resolve();
        }

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
    setState(state = {}) {
        this.state = state;
        this.router = this.render();
    }

    /**
     * A no-op transition.
     */
    transition(action, currentState, nextState, mutation) {
        return;
    }

    test(message, debug, level) {
        if(debug) {
            Rule.logger("bot: " + this.constructor.name, level);
        }

        return this.handleMessage(message, debug, level + 1).return(false);
    }

    toString() {
        return this.constructor.name;
    }

    sendMessage({ to, content })  {
        return Promise.resolve();
    }

    toJSON() {
        return this.state;
    }

    initialize() {
        this.setState(this.state);
    }

    /**
     * Create a new matcher from a rule.
     * @param  {Constructor}    rule     A rule constructor.
     * @param  {Object}         props    The rule's props.
     * @param  {...Function}    children Nested matchers returned from `Bot.rule`.
     * @return {Function} Returns a matcher.
     */
    static rule(rule, props, ...children) {
        if(!props) {
            props = {};
        }

        let action = props.action || props.handler;

        if(!(rule.prototype instanceof Bot) && !children.length && !action) {
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

        const inst = new rule({
            ...omit(props, "action", "handler"),
            action,
            children
        });

        if(inst instanceof Bot) {
            inst.initialize();
        }

        return inst;
    }
}