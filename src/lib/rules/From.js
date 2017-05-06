import Rule from "./Rule";

export default class From extends Rule {
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