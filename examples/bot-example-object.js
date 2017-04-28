/** @jsx Rule */
import Bot from "./Bot";
import {
    Rule,
    From,
    Match
} from "./Router";

export default class NumbersBot extends Bot {
    static initialState = {
        count: 0
    };

    constructor() {
        super(PokerGame.initialState);
    }

    render(state) {
        return (
            <From user={1}>
                <Match exactly="+1" action="INCREMENT" />
                <Match exactly="-1" action="INCREMENT" />
            </From>
        );
    }

    reduce(state, action, mutation) {
        console.log("reducing", state, action);
        switch(action.type) {
            case "INCREMENT":
                mutation("INCREMENT");

                return {
                    count: state.count + 1
                }
            break;

            case "DECREMENT":
                mutation("DECREMENT");

                return {
                    count: state.count - 1
                }
            break;

            default:
                return state;
        }
    }

    transition(action, state, nextState, transition) {
        console.log(transition);
        switch(transition.type) {
            case "INCREMENT":
            case "DECREMENT":
                return this.sendMessage({
                    to: action.payload.author,
                    content: `state ${transition.type.toLowerCase()}ed!`
                });
            break;
        }
    }
}