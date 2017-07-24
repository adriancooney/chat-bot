import Rule from "../Rule";

export default class Mention extends Rule {
    constructor(props, context) {
        super(props, context);

        if(!context.service && !props.handle && !props.symbol) {
            throw new Error("Mention cannot implicitly match a mention to the current user without a service context.");
        }
    }

    async match(input) {
        let formatted;

        if(this.props.handle) {
            if(this.props.symbol) {
                formatted = `${this.props.symbol}${this.props.handle}`;
            } else {
                formatted = this.context.service.formatMention({ handle: this.props.handle });
            }
        } else {
            formatted = this.context.service.formatMention(await this.context.service.getCurrentUser(input.community));
        }

        const match = input.content.match(new RegExp(`^\\s*${formatted}(\\s+|$)`, "i"));

        if(match) {
            return {
                content: input.content.slice(match.index + match[0].length)
            };
        } else {
            return false;
        }
    }

    toString() {
        return "mention";
    }
}

Rule.defaultRules.mention = Mention;