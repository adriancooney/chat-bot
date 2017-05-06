import { inspect } from "util";
import { omit } from "lodash";

export class Rule {
    constructor(props) {
        this.props = props;
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
        const { users, user, rooms, room } = this.props;

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
        const { users, user, rooms, room } = this.props;

        if(user) sources.push(`user ${user}`);
        if(users) sources.push(`users (${users.join(", ")})`);
        if(room) sources.push(`room ${room}`);
        if(rooms) sources.push(`rooms (${rooms.join(", ")})`);

        return `from ${sources.join(", ")}`;
    }
}

export class Match extends Rule {
    match({ content, ...attrs }) {
        const { exactly, expr } = this.props;

        if(typeof exactly !== "undefined") {
            exactly = exactly.toString();
            return content.startsWith(exactly) ? content.slice(exactly.length) : false;
        } else if(expr) {
            const match = content.match(expr);
            return match ? content.slice(match[0].length) : false;
        }
    }

    inspect() {
        return `match ${this.props.exactly ? "exactly " : ""}${inspect(this.props.exactly || this.props.expr)}`;
    }
}

export class Command extends Match {
    constructor({ name }) {
        super({
            name,
            expr: new RegExp(`\\s*${name}(?:\\s+|$)`)
        });
    }

    inspect() {
        return `command ${this.props.name}`;
    }
}

export class Mention extends Match {
    constructor({ handle, anywhere, symbol }) {
        if(!symbol) {
            symbol = "@";
        }

        super({ handle, anywhere, symbol, expr: new RegExp(`^\\s*${symbol}${handle}\\s+`) });
    }

    inspect() {
        return `mention @${this.props.handle}`;
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