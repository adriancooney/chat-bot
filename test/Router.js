/** @jsx Rule */
import assert from "assert";
import {
    Private,
    Rule,
    Match,
    Mention,
    From,
    Default
} from "../src/Router";

describe("Router", () => {
    it("should route", () => {
        let example = (
            <From users={[1, 2, 3, 4]}>
                <Private>
                    <Mention handle="bot">
                        <Match exactly="more" action="boo" />
                    </Mention>
                    <Match exactly="@desk" action="bar" />
                    <Match expr={/\d+/} action="vote" />
                    <Default action="other-default" />
                </Private>
                <Default action="default" />
            </From>
        );

        let inputs = [
            [["@bot more", { private: true, author: 2 }], "boo"],
            [["@desk more", { private: true, author: 2 }], "bar"],
            [["@desk more", { private: false, author: 2 }], "default"],
            [["@bot foo", { private: true, author: 2 }], "other-default"],
            [["foo", { private: false, author: 2 }], "default"],
            [["1", { private: true, author: 2 }], "vote"],
        ];

        inputs.forEach(([args, output]) => {
            assert.equal(example(...args), output);
        });
    });
});