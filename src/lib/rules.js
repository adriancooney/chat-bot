import { inspect } from "util";
import { omit, flatten } from "lodash";

export class Rule {
    constructor(props) {
        Object.assign(this, props);
    }
}

export class Private extends Rule {
    match(input) {
        return input.private;
    }

    inspect() {
        return "is private";
    }
}

export class From extends Rule {
    match({ content, ...attrs }) {
        const flags = [];
        const { users, user, rooms, room } = this;

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
    }

    inspect() {
        const sources = [];
        const { users, user, rooms, room } = this;

        if(user) sources.push(`user ${user}`);
        if(users) sources.push(`users (${users.join(", ")})`);
        if(room) sources.push(`room ${room}`);
        if(rooms) sources.push(`rooms (${rooms.join(", ")})`);

        return `from ${sources.join(", ")}`;
    }
}

export class Match extends Rule {
    match({ content, ...attrs }) {
        const { exactly, expr } = this;

        if(typeof exactly !== "undefined") {
            exactly = exactly.toString();
            return content.startsWith(exactly) ? content.slice(exactly.length) : false;
        } else if(expr) {
            const match = content.match(expr);
            return match ? content.slice(match[0].length) : false;
        }
    }

    inspect() {
        return `match ${this.exactly ? "exactly " : ""}${inspect(this.exactly || this.expr)}`;
    }
}

export class Command extends Match {
    constructor({ name }) {
        super({ expr: new RegExp(`\\s*${name}(?:\\s+|$)`) });

        this.name = name;
    }

    inspect() {
        return `command ${this.name}`;
    }
}

export class Mention extends Match {
    constructor({ handle, anywhere, symbol }) {
        if(!symbol) {
            symbol = "@";
        }

        super({ expr: new RegExp(`^\\s*${symbol}${handle}\\s+`) });

        this.handle = handle;
        this.anywhere = anywhere;
        this.symbol = symbol;
    }

    inspect() {
        return `mention @${handle}`;
    }
}

export class Default extends Rule {
    match() {
        return true;
    }

    inspect() {
        return "default to"
    }
}

export function createRule(rule, options, ...children) {
    const inst = new rule(options, children);
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

    if(children.length) {
        if(action) {
            throw new Error("Rule cannot have an action and children.");
        }

        // Flatten children to allow passing in of arrays
        children = flatten(children);
    }

    const matcher = Object.assign((message, debug, level = 0) => {
        let transform = inst.match(message);
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

        if(debug || matcher.debug) {
            const indent = "  ".repeat(level);
            if(level === 0) console.log(indent + "message: ", message);
            console.log(indent + `rule: ${inst.inspect()} = ${match ? "pass" : "fail"}`, `"${message.content}"`);
        }

        if(match && options && action) {
            if(options.transform) {
                return (...args) => action(options.transform(message), ...args);
            }

            // We bind the message object to the action handler so any transforms
            // applied by the rules are persisted.
            return action.bind(null, message);
        } else if(match && children.length) {
            for(var i = 0, len = children.length; i < len; i++) {
                const child = children[i];
                const childMatch = child(message, matcher.debug, level + 1);

                if(childMatch) {
                    return childMatch;
                }
            }
        } else {
            return null;
        }
    }, { options, children, inst, rule });

    matcher.inspect = matcher.toString = debug.bind(null, matcher, 0);

    return matcher;
}

function debug(matcher, indent = 0) {
    const ws = indent > 0 ? "  ".repeat(indent) : "";
    let output = inspect(matcher.inst);

    if(matcher.options && matcher.options.action) {
        const action = matcher.options.action;
        output = "if " + output + " do " + inspect(action);
    }

    output = ws + output;

    if(matcher.children) {
        output += "\n" + matcher.children.map(child => debug(child, indent + 1)).join("");
    }

    return output;
}