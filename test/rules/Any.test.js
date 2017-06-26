import assert from "assert";
import Rule from "../../src/rules/Rule";
import Any from "../../src/rules/Any";

describe("Any", () => {
    it("should correctly enter each rule", async () => {
        let i = 0;
        class A extends Rule {
            match() {
                i++;
                return false;
            }
        }

        const rule = (
            <Any>
                <A />
                <A />
            </Any>
        );

        const mount = await Rule.mount(rule);

        await mount.test({});
        assert.equal(i, 2);
    });
});