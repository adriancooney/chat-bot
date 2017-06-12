import { cloneDeep, pick, isPlainObject, last } from "lodash";
import MemoryService from "./MemoryService";

export default class TestService extends MemoryService {
    constructor() {
        super();

        this.deferred = [];
        this.queue = [];
        this.stack = [];
    }

    pushState() {
        this.stack.push(
            cloneDeep(
                pick(this, "people", "rooms", "messages")
            )
        );
    }

    popState() {
        Object.assign(this, this.stack.pop());
    }

    async getLastMessageInRoom(room, offset = 0) {
        const messages = await this.getMessagesForRoom(room.id);
        return messages[messages.length - 1 - offset];
    }

    async expectMessageInRoom(room, matcher, offset) {
        return TestService.matchMessage(await this.getLastMessageInRoom(room, offset), matcher);
    }

    async expectMessageToPerson(person, matcher) {
        return TestService.matchMessage((
            await this.getLastMessageInRoom(await this.getPrivateRoomForPerson(person.id))
        ), matcher);
    }

    connect(bot) {
        this.bot = bot;
    }

    async dispatch(message) {
        return this.bot.test(message, true);
    }

    async dispatchMessageToRoom(...args) {
        return this.dispatch(await this.sendMessageToRoom(...args));
    }

    async dispatchMessageToPerson(...args) {
        return this.dispatch(await this.sendMessageToPerson(...args));
    }

    static matchMessage(message, matcher) {
        if(!message) {
            throw new Error("Message is undefined.");
        }

        if(typeof matcher === "function" && !matcher(message)) {
            throw Object.assign(new Error(`Message does match predicate.`));
        }

        if(isPlainObject(matcher) && !deepEqual(message, matcher)) {
            throw Object.assign(
                new Error(`Message does match predicate.`),
                {
                    showDiff: true,
                    expected: matcher,
                    actual: message.toJSON()
                }
            );
        }

        if(matcher instanceof RegExp && !message.content.match(matcher)) {
            throw Object.assign(
                new Error(`Message does match RegExp.`),
                {
                    expected: matcher.toString(),
                    actual: message.content
                }
            );
        }
    }
}