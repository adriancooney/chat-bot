import assert from "assert";
import Promise from "bluebird";

export default function TestBot(bot, props, initialState) {
    return new (class TestBot extends bot {
        constructor(props) {
            super(props)

            this.messages = [];
            this.awaiting = [];
            this.debug = true;

            if(initialState) {
                this.state = initialState;
            }
        }

        awaitMessage() {
            if(this.messages.length) {
                return Promise.resolve(this.messages.shift());
            }

            return new Promise((resolve, reject) => {
                this.messages.push({ resolve, reject });
            });
        }

        async expectMessage(expected) {
            const message = await this.awaitMessage();
            assert.deepEqual(message, expected);
        }

        transition(action, state, nextState, transition) {
            console.log("transitioning: ", transition);
            return super.transition(action, state, nextState, transition);
        }

        reduce(state, action, transition) {
            console.log("reducing: ", action);
            return super.reduce(action, state, transition);
        }

        dispatch(type, payload) {
            console.log("dispatching action: ", typeof type === "object" ? type : { type, payload });
            return super.dispatch(type, payload);
        }

        handleMessage(message) {
            console.log(`message received { from ${message.author} } ${message.content}`);
            return super.handleMessage(message);
        }

        sendMessage(message) {
            console.log(`sending message: `, message);
            if(this.awaiting.length) {
                this.awaiting.shift().resolve(message);
            } else {
                this.messages.push(message);
            }

            return Promise.resolve();
        }
    })(props);
}