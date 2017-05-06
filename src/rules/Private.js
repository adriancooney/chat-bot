import Rule from "./Rule";

export default class Private extends Rule {
    match(input) {
        return input.private;
    }

    toString() {
        return "is private";
    }
}