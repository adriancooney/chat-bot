import Rule from "./Rule";

export default class From extends Rule {
    constructor(props, context) {
        const { users, user, rooms, room } = props;

        if([users, user, rooms, room].every(value => typeof value === "undefined")) {
            throw new Error("Please specify at least one source for a message: user, users, room or rooms");
        }

        super(props, context);
    }

    match(message) {
        const flags = [];
        const { users, user, rooms, room } = this.props;

        if(users) {
            flags.push(users.some(this.fromUser.bind(this, message)));
        } else if(user) {
            flags.push(this.fromUser(message, user));
        }

        if(rooms) {
            flags.push(rooms.some(this.fromRoom.bind(this, message)));
        } else if(room) {
            flags.push(this.fromRoom(message, room));
        }

        return flags.every(b => b);
    }

    fromRoom(message, room) {
        if(typeof room === "number") {
            return message.source.id === room;
        } else if(typeof room === "string") {
            return message.source.title === room;
        } else if(this.context.service.compareRoom(message.source, room) === 0) {
            return true;
        } else {
            return false;
        }
    }

    fromUser(message, user) {
        if(typeof user === "number") {
            return message.author.id === user;
        } else if(typeof user === "string") {
            return message.author.handle === user;
        } else if(this.context.service.comparePerson(message.author, user) === 0) {
            return true;
        } else {
            return false;
        }
    }

    toString() {
        const sources = [];
        const { users, user, rooms, room } = this.props;

        if(user) {
            sources.push(`user @${user.handle}`);
        }

        if(users) {
            sources.push(`users (${users.map(user => `@${user.handle}`).join(", ")})`);
        }

        if(room) {
            sources.push(`room "${room.title}"`);
        }

        if(rooms) {
            sources.push(`rooms (${rooms.map(room => `"${room.title}"`).join(", ")})`);
        }

        return `from ${sources.join(" and ")}`;
    }
}