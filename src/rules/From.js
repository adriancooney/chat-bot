import Rule from "./Rule";

export default class From extends Rule {
    constructor(props) {
        const { users, user, rooms, room } = props;

        if([users, user, rooms, room].every(value => typeof value === "undefined")) {
            throw new Error("Please specify at least one source for a message: user, users, room or rooms");
        }

        super(props);
    }

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

        return flags.every(b => b);
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