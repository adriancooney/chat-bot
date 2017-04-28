import Promise from "bluebird";

export default class Bot {
    constructor(initialState) {
        this.state = initialState || this.initialState;
        this.router = this.render(this.state);
        this.queue = [];
    }

    handleMessage(message) {
        console.log(`message received { from ${message.author} } ${message.content}`);
        if(this.router) {
            const action = this.router(message, this.state);

            if(action) {
                if(action.length === 3) {
                    return action(message, this.state, this.dispatch.bind(this));
                } else {
                    return this.dispatch(action(message));
                }
            }
        }
    }

    dispatch(action) {
        if(this.transitioning) {
            return new Promise((resolve, reject) => this.queue.unshift({ action, resolve, reject }));
        }

        const mutations = [];
        const nextState = this.reduce(this.state, action, (type, payload = action.payload) => mutations.push({ type, payload}));
        return this.transitioning = Promise.mapSeries(mutations, this.transition.bind(this, action, this.state, nextState)).then(() => {
            this.state = nextState;
            this.router = this.render(this.state);
            this.transitioning = null;

            if(this.queue.length) {
                const { action, resolve, reject } = this.queue.pop();
                this.dispatch(action).then(reject, resolve);
            }

            return null;
        });
    }

    sendMessage({ to, content })  {
        console.log(`sending message: { to ${to} } ${content}`);
        return Promise.resolve();
    }
}