import Rule from "../Rule";

export default class Private extends Rule {
    match(message) {
        return !!message.private;
    }

    toString() {
        return "is private";
    }
}

Rule.defaultRules.private = Private;