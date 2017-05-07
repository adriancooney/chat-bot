import Rule from "./Rule";

export default class Any extends Rule {
    constructor(props) {
        super({
            ...props,
            any: true
        });
    }

    match() {
        return true;
    }

    toString() {
        return "any of"
    }
}