/** @jsx Rule */
import Bot from "./Bot";
import {
    Rule,
    Mention,
    Command,
    From
} from "./Router";

export default class PokerBot extends Bot {
    constructor({ room, moderator, participants }) {
        super({
            room,
            moderator,
            participants,
            state: "waiting",
            currentRound: null,
            rounds: {
                pending: [],
                completed: [],
                skipped: []
            }
        });
    }

    render(state) {
        return this.renderModerator(state);
    }

    renderModerator(state) {
        const inputs = [];

        switch(state.state) {
            case "waiting":
                inputs.push(<Command name="plan" handler={this.plan.bind(this)} />);
            break;

            case "ready":
                inputs.push(
                    <Command name="start" handler={this.start} />
                );
            break;
        }

        inputs.push(
            <Command name="add" handler={this.addUser} />,
            <Command name="remove" handler={this.removeUser} />
        );

        return (
            <From user={state.moderator}>
                {inputs}
            </From>
        );
    }

    reduce(state, action) {
        switch(action.type) {
            case "PLAN":
                const { action } = state;

                return Object.assign({}, state, {
                    state: "ready",
                    tasklist
                });
            break;

            default:
                return state;
        }
    }

    plan({ content, author }) {
        // Attempt to validate the tasklist
        if(!content.match(/teamwork.com/)) {
            return this.sendMessage({
                content: "Uh oh, I don't recognize that tasklist!",
                to: author
            });
        }

        // Grab the tasks from the API and create the rounds

        return this.dispatch("PLAN", { tasklist: content });
    }

    addUser() {}
    removeUser() {}
    start() {}
}