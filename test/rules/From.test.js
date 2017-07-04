import assert from "assert";
import Rule from "../../src/Rule";
import From from "../../src/rules/From";

describe("From", () => {
    it("should require at least one source to be from", async () => {
        try {
            await Rule.mount(<From />);
        } catch (err) {
            assert(err.message.match(/Please specify at least one source/));
        }
    });

    it("should allow a message to pass if it's from a single user by id", async () => {
        const mount = await Rule.mount(<From user={1} />);

        assert(await mount.match({
            author: {
                id: 1
            }
        }));

        assert(!(await mount.match({
            author: {
                id: 2
            }
        })));
    });

    it("should allow a message to pass if it's from one of multiple users by id", async () => {
        const mount = await Rule.mount(<From users={[1, 2, 3]} />);

        assert(await mount.match({
            author: {
                id: 1
            }
        }));

        assert(!(await mount.match({
            author: {
                id: 10
            }
        })));
    });

    it("should allow a message to pass if it's from a room by id", async () => {
        const mount = await Rule.mount(<From room={1} />);

        assert(await mount.match({
            source: {
                id: 1
            }
        }));

        assert(!(await mount.match({
            source: {
                id: 10
            }
        })));
    });

    it("should allow a message to pass if it's from one of multiple rooms by id", async () => {
        const mount = await Rule.mount(<From rooms={[1, 2, 3]} />);

        assert(await mount.match({
            source: {
                id: 1
            }
        }));

        assert(!(await mount.match({
            source: {
                id: 10
            }
        })));
    });

    it("should allow a message to pass if it's from a single user by string", async () => {
        const mount = await Rule.mount(<From user={"adrian"} />);

        assert(await mount.match({
            author: {
                handle: "adrian"
            }
        }));

        assert(!(await mount.match({
            author: {
                handle: "foobar"
            }
        })));
    });

    it("should allow a message to pass if it's from one of multiple users by string", async () => {
        const mount = await Rule.mount(<From users={["adrian", "foo", "bar"]} />);

        assert(await mount.match({
            author: {
                handle: "adrian"
            }
        }));

        assert(!(await mount.match({
            author: {
                id: "foobar"
            }
        })));
    });

    it("should allow a message to pass if it's from a room by string", async () => {
        const mount = await Rule.mount(<From room={"Example Room"} />);

        assert(await mount.match({
            source: {
                title: "Example Room"
            }
        }));

        assert(!(await mount.match({
            source: {
                id: "Another Room"
            }
        })));
    });

    it("should allow a message to pass if it's from one of multiple rooms by string", async () => {
        const mount = await Rule.mount(<From rooms={["Room", "Example Room", "Root"]} />);

        assert(await mount.match({
            source: {
                title: "Example Room"
            }
        }));

        assert(!(await mount.match({
            source: {
                id: "Another Room"
            }
        })));
    });

    it("should allow from rooms and users", async () => {
        const mount = await Rule.mount(<From rooms={["Room", "Example Room", "Root"]} user={1} />);

        assert(await mount.match({
            source: {
                title: "Example Room"
            },
            author: {
                id: 1
            }
        }), "Room");

        assert(!(await mount.match({
            source: {
                title: "Foobar"
            },
            author: {
                id: 1
            }
        })), "User");
    });
});