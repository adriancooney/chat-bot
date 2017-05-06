import Rule from "./Rule";

export default class Private extends Rule {
    match(input) {
        return input.private;
    }

    inspect() {
        return "is private";
    }
}