import repl from "repl";
import MemoryService from "./MemoryService";

export default class LoggingService extends MemoryService {
    async init() {
        const result = await super.init();

        if(process.argv.indexOf("--repl") > -1) {
            const input = repl.start("> ");

            Object.assign(input.context, {
                service: this
            });
        }

        return result;
    }

    log(...args) {
        console.log("<", ...args);
    }

    async addRoom(room) {
        room = await super.addRoom(room);
        this.log(`new room: ${room.title}`);
        return room;
    }

    async addPerson(person) {
        person = await super.addPerson(person);
        this.log(`new person: ${person.handle}`);
        return person;
    }

    async addPersonToRoom(person, room) {
        this.log(`new person in room: ${person.handle} -> ${room.title}`);
        return await super.addPersonToRoom(person, room);
    }

    async addMessage(message) {
        message = await super.addMessage(message);
        this.log(`${message.source.title} -> @${message.author.handle}: ${message.content}`);
        return message;
    }
}