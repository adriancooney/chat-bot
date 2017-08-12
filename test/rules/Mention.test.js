import assert from "assert";
import Rule from "../../src/Rule";
import Mention from "../../src/rules/Mention";

const context = {
    service: {
        async getCurrentUser() {
            return {
                handle: "foo"
            }
        },

        formatMention(person) {
            return `@${person.handle}`;
        }
    }
}

describe("Any", () => {
    it("should implicitly match the currentUser from the service context", async () => {
        const mount = await Rule.mount(<Mention />, context);

        assert.deepEqual(await mount.match({
            content: "@foo"
        }), {
            content: ""
        });

        assert.deepEqual(await mount.match({
            content: "@foo bar"
        }), {
            content: "bar"
        });

        assert.deepEqual(await mount.match({
            content: "bar @foo bar"
        }), false);
    });

    it("should throw an error if no service is provided and is expected to match implicitly", async () => {
        try {
            await Rule.mount(<Mention />);
        } catch(err) {
            assert.equal(err.message, "Mention cannot implicitly match a mention to the current user without a service context.");
        }
    });

    it("should match with `handle` and `symbol` props", async () => {
        const mount = await Rule.mount(<Mention symbol="@" handle="foo" />);

        assert.deepEqual(await mount.match({
            content: "@foo bar"
        }), {
            content: "bar"
        });

        assert.deepEqual(await mount.match({
            content: "bar @foo bar"
        }), false);
    });

    it("should match with just `handle` and service context", async () => {
        const mount = await Rule.mount(<Mention handle="dude" />, context);

        assert.deepEqual(await mount.match({
            content: "@dude bar"
        }), {
            content: "bar"
        });

        assert.deepEqual(await mount.match({
            content: "bar @dude bar"
        }), false);
    });
});