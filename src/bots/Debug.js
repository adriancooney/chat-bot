import { exec } from "child_process";
import { inspect } from "util";
import Bot from "../Bot";
import { Rule, Private, From, Command, Any, Mention } from "../rules";

export default class Debug extends Bot {
    render() {
        const commands = (
            <Command name="uptime" handler={this.uptime.bind(this)} />
        );

        return (
            <Any>
                <From user={this.props.operator}>
                    <Private>
                        { commands }
                    </Private>
                    <Mention>
                        { commands }
                    </Mention>
                </From>
            </Any>
        );
    }

    async uptime({ source }) {
        const uptime = process.uptime();
        const cpu = process.cpuUsage();
        const mem = process.memoryUsage();

        return this.sendMessage(source.room.id, `Uptime: ${uptime}, CPU: ${inspect(cpu)}, Memory: ${inspect(mem)}`);
    }
}