import assert from "assert";
import Bot from "../src/Bot";

describe("Bot", () => {
    describe("#dispatch", () => {
        it("should run all transitions regardless of outcome", async () => {
            class A extends Bot {
                reduce(state, action, transition) {
                    transition("a");
                    transition("b");
                    transition("c");

                    return Math.random();
                }

                async transition(action, state, nextState, mutation) {
                    if(mutation.type === "b") {
                        throw new Error("Transition failure 1");
                    }

                    if(mutation.type === "c") {
                        throw new Error("Transition failure 2")
                    }
                }
            }

            const a = new A();

            return a.dispatch("ANY").then(() => {
                throw new Error("Dispatching did not error.")
            }).catch(err => {
                assert(err.message.match(/Transition failure 1/));
                assert(err.errors[0].message.match(/Transition failure 2/));
            });
        });
    });
});