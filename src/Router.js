import { inspect } from "util";
import { omit } from "lodash";
import tt from "treis";

export function Private() {
    return Object.assign(({ content, ...attrs }) => attrs.private, {
        inspect() {
            return "is private";
        }
    });
}

export function From({ users, user, rooms, room }, children) {
    return Object.assign(({ content, ...attrs }) => {
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
            const sources = [];

            if(user) sources.push(`user ${user}`);
            if(users) sources.push(`users (${users.join(", ")})`);
            if(room) sources.push(`room ${room}`);
            if(rooms) sources.push(`rooms (${rooms.join(", ")})`);

            return `from ${sources.join(", ")}`;
        }
    });
}

export function Command({ name }) {
    return Object.assign(Match({ expr: new RegExp(`\\s*${name}\\s+`) }), {
        inspect() {
            return `command ${name}`;
        }
    });
}

export function Match({ exactly, expr }) {
    return Object.assign(({ content, ...attrs }) => {
        if(typeof exactly !== "undefined") {
            exactly = (exactly).toString();
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

export function Mention({ handle, anywhere, symbol }) {
    if(!symbol) {
        symbol = "@";
    }

    return Object.assign(Match({
        expr: new RegExp(`^\\s*${symbol}${handle}\\s+`)
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
    let action = options.action || options.handler;

    if(!children.length && !action) {
        throw new Error("Leaf matchers must have an action.");
    }

    if(typeof action === "string") {
        action = message => ({ type: options.action, payload: message });
    }

    if(typeof action === "object") {
        action = () => (options.action);
    }

    const rule = Object.assign((message, level = 0) => {
        let transform = inst(message);
        let match = !!transform;

        if(typeof transform === "string") {
            transform = { content: transform };
            match = true; // Incase of empty string says match = false
        }

        if(typeof transform !== "object") {
            transform = null;
        }

        if(transform) {
            message = Object.assign({}, message, transform);
        }

        const indent = "  ".repeat(level);
        if(level === 0) console.log(indent + "message: ", message);
        console.log(indent + `rule: ${inst.inspect()} = ${match ? "pass" : "fail"}`);

        if(match && options && options.action) {
            return action;
        } else if(match && children.length) {
            for(var i = 0, len = children.length; i < len; i++) {
                const child = children[i];
                const childMatch = child(message, level + 1);

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