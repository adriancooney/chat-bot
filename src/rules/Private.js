import Rule from "./Rule";

export default class Private extends Rule {
    match(message) {
        return message.source.room.type === "pair";
    }

    toString() {
        return "is private";
    }
}