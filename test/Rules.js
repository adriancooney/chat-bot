import assert from "assert";
import {
    rule,
    anyRule,
    regex,
    immediateMention,
    mentionCommand,
    action,
    isAction
} from "../src/Rules";

describe("Rules", () => {

    describe("regex", () => {
        it("should match the content and remove it", () => {
            const matcher = regex(/foo\s/);
            assert.deepEqual(matcher(message("foo bar")), message("bar"));
            assert.equal(matcher(message("bar")), null);
        });
    });

    describe("mention", () => {
        it("should match a mention", () => {
            const matcher = immediateMention("adrianc");
            assert.deepEqual(matcher(message("@adrianc hello!")), message(" hello!"))
            assert.deepEqual(matcher(message("hello @adrianc")), null);
        });
    });

    describe("mentionCommand", () => {
        it("should match the mention command", () => {
            const matcher = mentionCommand("adrianc", "hello");

            assert.deepEqual(matcher(message("@adrianc hello  world")), message(" world"))
            assert.deepEqual(matcher(message("@adrianc world")), null)
            assert.deepEqual(matcher(message("hello @adrianc world")), null)
        });
    });

    describe("action", () => {
        it("should return an action", () => {
            const a = action("MY_ACTION");
            assert.deepEqual(a(), {
                "Action": "MY_ACTION"
            });
        });
    });

    describe("isAction, action", () => {
        it("should have an action", () => {
            assert(isAction(action("MY_ACTION")));
        });
    });

    describe("rule", () => {
        it("should return the action for a valid rule", () => {
            const r = rule(regex(/foo/), action("MY_ACTION"));

            assert.deepEqual(r(message("foo bar")), action("MY_ACTION")());
            assert.deepEqual(r(message("bar")), null);
        });

        it("should handle nested rules", () => {
            const r = anyRule(
                rule(regex(/foo/), action("HELLO_WORLD")),
                rule(regex(/bar/), action("WORLD_HELLO"))
            );

            assert.equal(r("root"), null);
            assert.deepEqual(r("foo"), action("HELLO_WORLD")());
            assert.deepEqual(r("bar"), action("WORLD_HELLO")());
        });
    });
});

function message(content) {
    return { content };
}