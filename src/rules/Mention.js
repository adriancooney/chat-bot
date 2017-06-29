import Rule from "./Rule";

export default class Mention extends Rule {
    async match(input) {
        let formatted;

        if(this.props.handle) {
            formatted = `${this.props.symbol}${this.props.handle}`;
        } else {
            formatted = this.context.service.formatMention(await this.context.service.getCurrentUser(input.community));
        }

        const match = input.content.match(new RegExp(`^\\s*${formatted}\\s+`, "i"));

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