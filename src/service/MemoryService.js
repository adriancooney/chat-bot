import { EventEmitter } from "events";
import { uniq, sum } from "lodash";

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

    async createRoom({ title, pair, people }) {
        const id = ++serial;
        const room = await this.addRoom({
            id,
            title,
            pair: !!pair,
            people: []
        });

        await this.addPersonToRoom(this.user, room);

        if(people && people.length) {
            for(let person of people) {
                await this.addPersonToRoom(person, room);
            }
        }

        return room;
    }

    async getMessagesForRoom(room) {
        return this.messages.filter(message => message.source.id === room.id);
    }

    async getRoom(id) {
        return this.rooms.find(room => room.id === id);
    }

    async getRoomByTitle(title) {
        return this.rooms.find(room => room.title === title);
    }

    async getRoomsForPerson(person) {
        return await Promise.all(this.rooms.filter(({ people }) => {
            return people.some(p => p === person.id);
        }));
    }

    async getPrivateRoomForPerson(person) {
        return (await this.getRoomsForPerson(person)).find(room => {
            return room.pair && room.people.includes(this.user.id) && room.people.includes(person.id);
        });
    }

    async getAllRooms() {
        return this.rooms;
    }

    async getPeopleForRoom(room) {
        return Promise.all(room.people.map(person => this.getPerson(person)));
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
            await this.addPersonToRoom(person, this.defaultRoom);
        }

        // Create the pair room
        if(this.user) {
            const privateRoom = await this.createRoom({
                title: `@${this.user.handle} & @${handle}`,
                pair: true
            });

            await this.addPersonToRoom(this.user, privateRoom);
            await this.addPersonToRoom(person, privateRoom);
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

    async getCurrentUser() {
        return this.user;
    }

    async addPersonToRoom(person, room) {
        Object.assign(room, {
            people: uniq(room.people.concat(person.id))
        });

        this.emit("room:new:person", { person, room });
    }

    async addMessage(message) {
        this.messages = this.messages.concat(message);
        this.emit("message", message);
        return message;
    }

    async sendMessageToRoom(room, message, author) {
        if(typeof message === "string") {
            message = { content: message };
        }

        room = await this.getRoom(room.id);

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

    async sendMessageToPerson(person, message, author) {
        if(typeof message === "string") {
            message = { content: message };
        }

        person = await this.getPerson(person.id);

        const pairRoom = this.rooms.find(room => {
            return room.pair && room.people.includes(person.id) && room.people.includes(author ? author.id : this.user.id);
        });

        return this.sendMessageToRoom(pairRoom, Object.assign(message, {
            private: true
        }), author);
    }

    async markRoomAsRead(room, person) {
        return (await this.getMessagesForRoom(room)).forEach(message => {
            Object.assign(message, {
                read: uniq(message.read.concat(person.id))
            });
        });
    }

    async getUnreadCountForRoom(room, person) {
        return (await this.getMessagesForRoom(room)).filter(message => !message.read.includes(person)).length;
    }

    async getUnreadCountForPerson(person) {
        return sum(
            await Promise.all(
                (await this.getRoomsForPerson(person)).map(room => this.getUnreadCountForRoom(room, person.id))
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
        return this.sendMessageToRoom(receive.source, input);
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