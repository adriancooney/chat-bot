import Rule from "./Rule";
import Match from "./Match";

export default class Command extends Rule {
    render() {
        return (
            <Match expr={new RegExp(`^\\s*(${this.props.name})(?:\\s+|$)`)} groups={["command"]} handler={this.props.handler}>
                { this.props.children }
            </Match>
        );
    }

    toString() {
        return `command ${this.props.name}`;
    }
}