import { inspect } from "util";
import { omit } from "lodash";
import tt from "treis";

export function Private() {
    return Object.assign((content, attrs) => attrs.private, {
        inspect() {
            return "is private";
        }
    });
}

export function From({ users, user, rooms, room }, children) {
    return Object.assign((content, attrs) => {
        const flags = [];

        if(users) {
            flags.push(users.indexOf(attrs.author) > 0);
        } else if(user) {
            flags.push(attrs.author === user);
        }

        if(rooms) {
            flags.push(rooms.indexOf(attrs.room) > 0);
        } else if(room) {
            flags.push(attrs.room === room);
        }

        return flags.length && flags.every(b => b);
    }, {
        inspect() {
            return `from users ${users.join(",")}`;
        }
    });
}

export function Match({ exactly, expr }) {
    return Object.assign((content, attrs) => {
        if(exactly) {
            return content.startsWith(exactly) ? content.slice(exactly.length) : false;
        } else if(expr) {
            const match = content.match(expr);
            return match ? content.slice(match[0].length) : false;
        }
    }, {
        inspect() {
            return `match ${exactly ? "exactly " : ""}${inspect(exactly || expr)}`;
        }
    });
}

export function Mention({ handle, anywhere }) {
    return Object.assign(Match({
        expr: new RegExp(`^\\s*@${handle}\\s+`)
    }), {
        inspect() {
            return `mention @${handle}`;
        }
    });
}

export function Default() {
    return Object.assign(() => true, {
        inspect() {
            return "default to"
        }
    });
}

export function Rule(predicate, options, ...children) {
    const inst = predicate(options, children);

    if(!children.length && !options.action) {
        throw new Error("Leaf matchers must have an action.");
    }

    const rule = Object.assign((content, attrs) => {
        let match = inst(content, attrs);

        if(typeof match === "string") {
            content = match;
            match = true;
        }

        if(match && options && options.action) {
            return options.action;
        } else if(match && children.length) {
            for(var i = 0, len = children.length; i < len; i++) {
                const child = children[i];
                const childMatch = child(content, attrs);

                if(childMatch) {
                    return childMatch;
                }
            }
        } else {
            return null;
        }
    }, {
        predicate: predicate,
        inst: inst,
        options, children
    });

    // All for console.log'ing routes.
    rule.inspect = rule.toString = debug.bind(null, rule, 0);

    return rule;
}

function hasDescendant(name, children) {
    return children.some(child => {
        if(child.predicate.name === name) {
            return true;
        } else if(child.children) {
            return hasDescendant(name, child.children);
        }
    });
}

function debug(route, indent = 0) {
    const ws = indent > 0 ? "  ".repeat(indent) : "";
    let output = inspect(route.inst);

    if(route.options && route.options.action) {
        const action = route.options.action;
        output = "if " + output + " do " + inspect(action);
    }

    output = ws + output;

    if(route.children) {
        output += "\n" + route.children.map(child => debug(child, indent + 1)).join("");
    }

    return output;
}