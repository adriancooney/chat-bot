import Rule from "./Rule";

export default class Default extends Rule {
    match() {
        return true;
    }

    inspect() {
        return "default to"
    }
}