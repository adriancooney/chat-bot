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
            return message.source.room.id === room;
        } else if(typeof room === "string") {
            return message.source.room.title === room;
        } else {
            return false;
        }
    }

    fromUser(message, user) {
        if(typeof user === "number") {
            return message.author.id === user;
        } else if(typeof user === "string") {
            return message.author.handle === user;
        } else {
            return false;
        }
    }

    toString() {
        const sources = [];
        const { users, user, rooms, room } = this.props;

        if(user) sources.push(`user ${user}`);
        if(users) sources.push(`users (${users.join(", ")})`);
        if(room) sources.push(`room ${room}`);
        if(rooms) sources.push(`rooms (${rooms.join(", ")})`);

        return `from ${sources.join(", ")}`;
    }
}