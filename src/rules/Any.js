import Rule from "./Rule";

export default class Any extends Rule {
    constructor(props, context) {
        super({
            ...props,
            any: true
        }, context);
    }

    match() {
        return true;
    }

    toString() {
        return "any of"
    }
}