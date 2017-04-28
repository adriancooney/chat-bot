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
            [{ content: "@bot more", private: true, author: 2 }, "boo"],
            [{ content: "@desk more", private: true, author: 2 }, "bar"],
            [{ content: "@desk more", private: false, author: 2 }, "default"],
            [{ content: "@bot foo", private: true, author: 2 }, "other-default"],
            [{ content: "foo", private: false, author: 2 }, "default"],
            [{ content: "1", private: true, author: 2 }, "vote"],
        ];

        inputs.forEach(([message, output]) => {
            assert.equal(example(message), output);
        });
    });
});