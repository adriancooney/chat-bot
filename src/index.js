const initialState = {
    participants: [],
    moderator: null,
    rounds: {
        completed: [],
        pending: [],
        skipped: []
    },
    currentRound: null
}

let state = initialState;

export function getState() {
    return state;
}

export function dispatch(action) {
    const nextState = reduce(state, action);

    if(nextState !== state) {
        const previousState = state;
        state = nextState;
    }
}

export async function handleStateChange(state, nextState) {

}

export async function handleMessage(message) {
    const state = getState();
    const routes = router(state);
    const action = matchRoute(routes, message);

    if(action) {
        await action(state, input)
    }
}

export function router(state) {
    const currentRound = pickCurrentRound(state);

    if(roundCount(state) == 0) {
        // We have not yet picked our tasks so the only function available is to pick our tasklist
        return (
            <From user={state.moderator}>
                <Command name="plan" action={plan} />
            </From>
        );
    } else if(currentRound) {
        // We have a current round, so we vote, skip, pass
        return [
            <Command name="pass" action={passRound} />,
            <Command name="skip" action={skipRound} />,
            <From user={state.moderator}>
                <Command name="estimate" action={estimateRound} />
            </From>,
            <From users={state.participants.voting}>
                <Match expr={/\d+/} action={vote} />
                <Default action={unknownInput} />
            </From>
        ];
    } else if(roundCount(state) > 0 && !currentRound && state.rounds.pending.length === 0) {
        // Game over!

    }
}

export default function reduce(state, action, transition) {
    switch(action.type) {
        case "START":
            return { ...state, currentRound: 0 };

        case "VOTE":
            const { participant, vote, source } = action.payload;
            const currentRound = state.rounds.pending[state.currentRound];

            transition("VOTE_RECEIVED", { participant, vote, currentRound });

            return {
                ...state,
                rounds: {}
            }

        case "SKIP":
            break;

        case "PASS":
            break;
    }
}

export async function transition(message, transition, state, nextState) {
    switch(transition.type) {
        case "VOTE_RECEIVED":

        break;

        case "NEXT_ROUND":
            return await notifyParticipants(state.participants, "Changing round.");
        break;
    }
}

function vote(participant, state, input) {
    if(isNaN(parseInt(input))) {
        throw new Error("Invalid input, please input a number.")
    }

    return dispatch("VOTE", {
        participant,
        vote: parseInt(input)
    });
}

function roundCount(state) {
    const rounds = state.rounds;
    return rounds.completed.length + rounds.pending.length + rounds.skipped.length;
}

function pickCurrentRound(state) {
    return state.rounds.pending[state.currentRound];
}

function pickVotingParticipants(state) {
    const currentRound = pickCurrentRound(state);

}