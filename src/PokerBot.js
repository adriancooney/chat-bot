/** @jsx Rule */
import Bot from "./Bot";
import {
    Rule,
    Mention,
    Command
} from "./Router";

export default class PokerBot extends Bot {
    constructor({ room, moderator, participants }) {
        super({
            room,
            moderator,
            participants,
            state: "waiting-for-game",
            currentRound: null,
            rounds: {
                pending: [],
                completed: [],
                skipped: []
            }
        });
    }

    render(state) {
        switch(state.state) {
            case "waiting":
                return (
                    <From user={state.moderator}>
                        <Command name="start" handler="START" />
                    </From>
                );
            break;
        }
    }

    reduce(state, action) {
        switch(action.type) {
            case "START":

        }
    }
}