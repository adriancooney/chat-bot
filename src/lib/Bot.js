import Promise from "bluebird";

export default class Bot {
    constructor(props) {
        this.props = props;
        this.queue = [];
        this.setState(this.state || {});
    }

    handleMessage(message) {
        if(this.router) {
            const action = this.router(message);

            if(action) {
                if(action.length === 2) {
                    return this.dispatch(action(message));
                } else {
                    return action(this.state, this.dispatch.bind(this));
                }
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

    setState(state) {
        this.state = state;
        this.router = this.render();
    }

    transition() {}

    sendMessage({ to, content })  {
        return Promise.resolve();
    }

    toJSON() {
        return this.state;
    }
}