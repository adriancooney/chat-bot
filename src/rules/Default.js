import Rule from "./Rule";

export default class Default extends Rule {
    match() {
        return true;
    }

    toString() {
        return "default to"
    }
}