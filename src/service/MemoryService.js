import { EventEmitter } from "events";
import { uniq, countBy, sum } from "lodash";

let serial = 0;

export default class MemoryService extends EventEmitter {
    constructor() {
        super();

        this.rooms = [];
        this.messages = [];
        this.people = [];
    }

    async init() {
        this.user = await this.createPerson({
            handle: "bot"
        });

        this.defaultRoom = await this.createRoom({
            title: "Default Room"
        });

        this.initialized = true;
    }

    async addRoom(room) {
        this.rooms = this.rooms.concat(room);
        this.emit("room", room);
        return room;
    }

    async createRoom({ title, pair }) {
        const id = ++serial;
        const room = {
            id,
            title,
            pair: !!pair,
            people: []
        };

        await this.addRoom(room);
        await this.addPersonToRoom(this.user.id, id);

        return this.getRoom(id);
    }

    async getMessagesForRoom(id) {
        return this.messages.filter(message => message.source.id === id);
    }

    async getRoom(id) {
        return this.rooms.find(room => room.id === id);
    }

    async getRoomsForPerson(id) {
        return await Promise.all(this.rooms.filter(({ people }) => {
            return people.some(person => person === id);
        }));
    }

    async getPrivateRoomForPerson(id) {
        return (await this.getRoomsForPerson(id)).find(room => {
            return room.pair && room.people.includes(this.user.id);
        });
    }

    async getAllRooms() {
        return this.rooms;
    }

    async getPeopleForRoom(id) {
        return Promise.all((await this.getRoom(id)).people.map(person => this.getPerson(person)));
    }

    async addPerson(person) {
        this.people = this.people.concat(person);
        this.emit("person", person);
        return person;
    }

    async createPerson({ handle, firstName, lastName }) {
        const id = ++serial;

        await this.addPerson({
            id, handle, firstName, lastName
        });

        const person = await this.getPerson(id);

        if(this.defaultRoom) {
            await this.addPersonToRoom(person.id, this.defaultRoom.id);
        }

        // Create the pair room
        if(this.user) {
            const privateRoom = await this.createRoom({
                title: `@${this.user.handle} & @${handle}`,
                pair: true
            });

            await this.addPersonToRoom(this.user.id, privateRoom.id);
            await this.addPersonToRoom(person.id, privateRoom.id);
        }

        return person;
    }

    async getPerson(id) {
        return this.people.find(person => person.id === id);
    }

    async getPersonByHandle(handle) {
        return this.people.find(person => person.handle === handle);
    }

    async getAllPeople() {
        return this.people;
    }

    async addPersonToRoom(personId, roomId) {
        const room = await this.getRoom(roomId);

        Object.assign(room, {
            people: uniq(room.people.concat(personId))
        });

        this.emit("room:new:person", { personId, roomId });
    }

    async addMessage(message) {
        console.log(`${message.source.title} -> @${message.author.handle}: ${message.content}`);
        this.messages = this.messages.concat(message);
        this.emit("message", message);
        return message;
    }

    async sendMessageToRoom(id, message, author) {
        if(typeof message === "string") {
            message = { content: message };
        }

        const room = await this.getRoom(id);

        const newMessage = {
            id: ++serial,
            source: room,
            author: author || this.user,
            private: message.private || room.pair,
            read: [],
            mentions: MemoryService.parseMentions(message.content),
            ...message
        };

        return this.addMessage(newMessage);
    }

    async sendMessageToPerson(id, message, author) {
        if(typeof message === "string") {
            message = { content: message };
        }

        const pairRoom = this.rooms.find(room => {
            return room.people.length === 2 && room.people.includes(id) && room.people.includes(author ? author.id : this.user.id);
        });

        return this.sendMessageToRoom(pairRoom.id, Object.assign(message, {
            private: true
        }), author);
    }

    async markRoomAsRead(roomId, personId) {
        return (await this.getMessagesForRoom(roomId)).forEach(message => {
            Object.assign(message, {
                read: uniq(message.read.concat(personId))
            });
        });
    }

    async getUnreadCountForRoom(roomId, personId) {
        return (await this.getMessagesForRoom(roomId)).filter(message => !message.read.includes(personId)).length;
    }

    async getUnreadCountForPerson(personId) {
        return sum(
            await Promise.all(
                (await this.getRoomsForPerson(personId)).map(room => this.getUnreadCountForRoom(room.id, personId))
            )
        );
    }

    isPerson(person) {
        return this.people.includes(person);
    }

    isRoom(room) {
        return this.rooms.includes(room);
    }

    reply(receive, input) {
        return this.sendMessageToRoom(receive.source.id, input);
    }

    formatMention(person) {
        return `@${person.handle}`;
    }

    compareRoom(a, b) {
        return a.id === b.id ? 0 : 1;
    }

    comparePerson(a, b) {
        return a.id === b.id ? 0 : 1;
    }

    emit(...args) {
        if(!this.queued) {
            this.queued = true;
            process.nextTick(() => {
                super.emit("*", ...args);
                this.queued = false;
            });
        }

        super.emit(...args);
    }

    static parseMentions(string) {
        const matcher = /@([a-zA-Z_]+)/g;
        const mentions = [];

        let match;
        while(match = matcher.exec(string)) {
            mentions.push({
                handle: match[1],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }

        return mentions;
    }

    connect(bot, debug = true) {
        this.on("message", message => {
            if(message.author.id !== this.user.id) {
                bot.test(message, debug).catch(this.emit.bind(this, "error"));
            }
        });
    }
}