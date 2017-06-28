import Rule from "./Rule";

export default class Any extends Rule {
    constructor(props, context) {
        super(props, context);
        this.any = true;
    }

    match() {
        return true;
    }

    toString() {
        return "any of";
    }
}