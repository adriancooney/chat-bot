export default function PokerGame(state) {
    return (
        <Private>
            <Match expr={/hello!/} action="NEW_GREETING" />
            <Match expr={/who greeted?/} handler={whoGreeted} />
        </Private>
    );
}

const initialState = {
    greetings: []
};

export function *reduce(state = initialState, action, transition) {
    switch(action.type) {
        case "GREETING_RECEIVED":
            transition("NEW_GREETING", action.payload);

            return {
                greetings: [action.payload, ...state.greetings]
            }
        break;

        default:
            return state;
    }
}

export function transition(transition, message, state, previousState) {
    switch(transition.type) {
        case "INCREMENT":
            return this.sendMessage
    }
}

function greeting(message, state) {
    dispatch("GREETING_RECEIVED", message.author);
}

function whoGreeted(message, state) {
    return sendMessage(message.author, state.greetings.join(", ") + " have all greeted.");
}