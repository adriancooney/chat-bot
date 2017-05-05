import Promise from "bluebird";
import assert from "assert";

export default class Bot {
    constructor(initialState) {
        this.state = initialState || this.initialState;
        this.router = this.render(this.state);
        this.queue = [];
    }

    handleMessage(message) {
        console.log(`message received { from ${message.author} } ${message.content}`);
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

    transition() {

    }

    sendMessage({ to, content })  {
        console.log(`sending message: { to ${to} } ${content}`);
        return Promise.resolve();
    }
}

export function TestBot(bot, ...args) {
    return new (class TestBot extends bot {
        constructor(...args) {
            super(...args)

            this.queue = [];
            this.awaiting = [];
        }

        awaitMessage() {
            if(this.queue.length) {
                return Promise.resolve(this.queue.shift());
            }

            return new Promise((resolve, reject) => {
                this.queue.push({ resolve, reject });
            });
        }

        async expectMessage(expected) {
            const message = await this.awaitMessage();
            assert.deepEqual(message, expected);
        }

        sendMessage(message) {
            if(this.awaiting.length) {
                this.awaiting.shift().resolve(message);
            } else {
                this.queue.push(message);
            }

            return Promise.resolve();
        }
    })(...args);
}