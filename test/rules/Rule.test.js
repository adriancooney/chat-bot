import assert from "assert";
import { inspect } from "util";
import Rule from "../../src/rules/Rule";


describe("Rule", () => {
    describe(".create", () => {
        it("should return the right object descriptor", () => {
            const rule = Rule.create(Rule, {
                a: 1
            });

            assert.deepEqual(rule, {
                type: Rule,
                props: {
                    a: 1,
                    children: []
                }
            });
        });

        it("should accept undefined props", () => {
            const rule = Rule.create(Rule);

            assert.deepEqual(rule, {
                type: Rule,
                props: {
                    children: []
                }
            });
        });

        it("should not accept handler prop and children", () => {
            assert.throws(() => {
                const rule = Rule.create(Rule, {
                    handler: () => {}
                }, [
                    Rule.create(Rule),
                    Rule.create(Rule)
                ]);
            });
        });
    });

    describe(".mount", () => {
        it("should handle null", async () => {
            assert.equal(await Rule.mount(null), null);
        });

        it("should correctly mount a basic rule", async () => {
            const mount = await Rule.mount(<Rule a="b" c={1} />);
            assert.deepEqual(mount.props, {
                a: "b",
                c: 1,
                children: []
            });
        });

        it("should handle a nested null", async () => {
            const rule = (
                <Rule>
                    { null }
                </Rule>
            );

            const mount = await Rule.mount(rule);
            assert.equal(mount.mount, null);
            assert(mount.props.children.length === 0);
        });

        it("should pass correct props to constructor", async () => {
            class R extends Rule {
                constructor(props) {
                    super(props);

                    assert.deepEqual(props, {
                        a: 1,
                        children: []
                    });
                }
            }

            await Rule.mount(<R a={1} />);
        });

        it("should call render when props change", async () => {
            class R extends Rule {
                renderCount = 0;

                render() {
                    this.renderCount++;
                    return null;
                }
            }

            const mount = await Rule.mount(<R />);
            const mount2 = await Rule.mount(<R a={1} />, undefined, mount);
            assert.equal(mount.renderCount, 2);
        });

        it("should correctly reuse existing mount and not recreate instances", async () => {
            let aCount = 0;
            let bCount = 0;

            class A extends Rule {
                constructor() {
                    super();
                    aCount++;
                }

                render() {
                    return <Rule />
                }
            }

            class B extends Rule {
                constructor() {
                    super();
                    bCount++;
                }

                render() {
                    return <Rule />
                }
            }

            const rule = (
                <Rule>
                    <A />
                    <B />
                </Rule>
            );

            const mount = await Rule.mount(rule);

            const rule2 = (
                <Rule>
                    <A foo="bar" />
                    <B />
                </Rule>
            );

            const mount2 = await Rule.mount(rule2, undefined, mount);

            assert(mount === mount2, "Same instance not returned");
            assert(mount.mount[0] === mount2.mount[0], "No new A element");
            assert(mount.mount[1] === mount2.mount[1], "No same B element");
            assert.equal(mount2.mount[0].props.foo, "bar");
            assert.equal(aCount, 1, "expected A construction different");
            assert.equal(bCount, 1, "expected B construction different");
        });

        it("should not recreate children with the same props (no key)", async () => {
            class RoomManager extends Rule {
                render() {
                    return (
                        <Rule>
                            {this.props.rooms.map(id => <Rule id={id}/>)}
                        </Rule>
                    );
                }
            }

            let a = (<RoomManager rooms={[1, 2]} />);
            let b = (<RoomManager rooms={[1, 2, 3]} />);
            let mount = await Rule.mount(a);
            let mount2 = await Rule.mount(b, undefined, mount);
            assert(mount.mount.mount[0] === mount2.mount.mount[0], "Incorrect first child instance");
            assert(mount.mount.mount[1] === mount2.mount.mount[1], "Incorrect second child instance");

            a = (<RoomManager rooms={[0, 1]} />);
            b = (<RoomManager rooms={[1, 1]} />);
            mount = await Rule.mount(a);
            mount2 = await Rule.mount(b, undefined, mount);

            assert(mount.mount.mount[0] === mount2.mount.mount[0], "changed props mount different");
            assert(mount.mount.mount[1] === mount2.mount.mount[1], "unchanged props mount different");
        });

        it("should not recreate children with the same props and key", async () => {
            class RoomManager extends Rule {
                render() {
                    return (
                        <Rule>
                            {this.props.rooms.map(({ key, i }) => <Rule key={key} i={i} />)}
                        </Rule>
                    );
                }
            }

            const a = (<RoomManager rooms={[{ key: 1, i: 1 }, { key: 2, i: 2 }]} />);
            const b = (<RoomManager rooms={[{ key: 2, i: 10 }, { key: 1, i: 2 }]} />);

            const mount = await Rule.mount(a);
            assert.equal(mount.mount.mount[0].props.i, 1);
            mount.mount.mount[1].canary = true;

            const mount2 = await Rule.mount(b, undefined, mount);
            assert(mount2.mount.mount[0].canary);
            assert.equal(mount2.mount.mount[0].props.i, 10);
        });

        it("should not trigger a rerender if props don't change", async () => {
            let renderCount = 0;

            class A extends Rule {
                render() {
                    renderCount++;
                    return null;
                }
            }

            const a = (<A />);
            const mount = await Rule.mount(a);
            const mount2 = await Rule.mount(a, undefined, mount);

            assert(mount === mount2);
            assert.equal(renderCount, 1);
        });

        it("should respect a rule's render method", async () => {
            class C extends Rule {
                render() {
                    return <Rule foo="bar" />;
                }
            }

            const mount = await Rule.mount(<C />);
            assert.equal(mount.mount.tree.props.foo, "bar");
        });

        it("should throw an error for render method that doesn't return rule", async () => {
            try {
                class D extends Rule {
                    render() {
                        return false;
                    }
                }

                await Rule.mount(<D />);
            } catch(err) {
                assert.equal(err.message, "render method must return a valid rule or `null`.");
            }
        });

        it("should allow render to return null", async () => {
            class D extends Rule {
                render() {
                    return null;
                }
            }

            await Rule.mount(<D />);
        });

        it("should call onMount when mounted", async () => {
            let mounted = false;

            class R extends Rule {
                onMount() {
                    mounted = true;
                }

                render() {
                    return null;
                }
            }

            await Rule.mount(<R />);
            assert(mounted);
        });

        it("should bubble onMount errors", async () => {
            let mounted = false;

            class R extends Rule {
                async onMount() {
                    throw new Error("onMountError");
                }

                render() {
                    return null;
                }
            }

            try {
                await Rule.mount(<R />);
            } catch(err) {
                assert.equal(err.message, "onMountError");
            }
        });

        it("should call onUnmount when unmounting", async () => {
            let unmounted = false;

            class R extends Rule {
                async onUnmount() {
                    unmounted = true;
                }

                render() {
                    return null;
                }
            }

            const mount = await Rule.mount(<R />);
            const mount2 = await Rule.mount(<Rule />, undefined, mount);

            assert(unmounted);
        });

        it("should bubble onUnmount errors", async () => {
            class R extends Rule {
                async onUnmount() {
                    throw new Error("onUnmountError");
                }

                render() {
                    return null;
                }
            }

            try {
                await Rule.mount(<R />);
            } catch(err) {
                assert.equal(err.message, "onUnmountError");
            }
        });

        it("should pass context to constructor", async () => {
            class A extends Rule {
                constructor(props, context) {
                    super(props, context);

                    assert.deepEqual(context, {
                        a: 1
                    });
                }
            }

            const mount = await Rule.mount(<A />, {
                a: 1
            });

            assert.deepEqual(mount.context, {
                a: 1
            });
        });

        it("should still assign context to object regardless if not passed to super", async () => {
            class A extends Rule {
                constructor(props, context) {
                    super(props);
                }
            }

            const mount = await Rule.mount(<A />, {
                a: 1
            });

            assert.deepEqual(mount.context, {
                a: 1
            });
        });
    });

    describe("#test", () => {
        it("should only visit a single node in a child list if it matches", async () => {
            let i = 0;

            class A extends Rule {
                match() {
                    i++;
                    return true;
                }
            }

            const rule = (
                <Rule>
                    <A />
                    <A />
                </Rule>
            );

            const mount = await Rule.mount(rule);
            await mount.test({});
            assert.equal(i, 1);
        });
    });
});