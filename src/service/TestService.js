import http from "http";
import { cloneDeepWith, pick, isPlainObject, isEqual } from "lodash";
import LoggingService from "./LoggingService";

export default class TestService extends LoggingService {
    constructor(options) {
        super(options);

        this.deferred = [];
        this.queue = [];
        this.stack = [];
    }

    isEntity(value) {
        return this.isPerson(value) || this.isRoom(value) || this.isMessage(value);
    }

    pushState() {
        const customizer = value => this.isEntity(value) ? value : undefined;

        this.stack.push({
            service: cloneDeepWith(pick(this, "people", "rooms", "messages"), customizer),
            bot: this.bot ? cloneDeepWith(this.bot.state, customizer) : null
        });
    }

    async popState() {
        const popped = this.stack.pop();
        Object.assign(this, popped.service);

        if(this.bot && popped.bot) {
            await this.bot.setState(popped.bot);
        }
    }

    async getLastMessageInRoom(room, offset = 0) {
        const messages = await this.getMessagesForRoom(room);
        return messages[messages.length - 1 - offset];
    }

    async expectMessageInRoom(room, matcher, offset) {
        return TestService.matchMessage(await this.getLastMessageInRoom(room, offset), matcher);
    }

    async expectMessageToPerson(person, matcher, offset) {
        return TestService.matchMessage((
            await this.getLastMessageInRoom(await this.getPrivateRoomForPerson(person), offset)
        ), matcher);
    }

    connect(bot) {
        this.bot = bot;

        if(this.options.debug) {
            this.bot.debug = true;
        }
    }

    async dispatch(message) {
        return this.bot.test(message, this.options.debug);
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
            throw Object.assign(new Error("Message does match predicate."));
        }

        if(isPlainObject(matcher) && !isEqual(message, matcher)) {
            throw Object.assign(
                new Error("Message does match predicate."),
                {
                    showDiff: true,
                    expected: matcher,
                    actual: message.toJSON()
                }
            );
        }

        if(matcher instanceof RegExp && !message.content.match(matcher)) {
            throw Object.assign(
                new Error("Message does match RegExp."),
                {
                    expected: matcher.toString(),
                    actual: message.content
                }
            );
        }
    }

    listen(port = 8075) {
        this.server = http.createServer((req, res) => {
            return this.handleRequest(req, res).catch(err => {
                return {
                    status: 500,
                    body: {
                        error: true,
                        meta: {
                            message: err.message,
                            stack: err.stack
                        }
                    }
                };
            }).then(({ status, body }) => {
                res.writeHead(status || 200, {
                    "Content-Type": "application/json"
                });

                res.write(JSON.stringify(body));
                res.end();
            });
        });

        this.server.listen(port);
    }

    async handleRequest(req) {
        if(req.method !== "POST") {
            throw new Error("The bot API only accepts POST requests.");
        }

        const body = JSON.parse(await new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data", chunk => chunks.push(chunk));
            req.on("error", reject);
            req.on("end", () =>resolve(Buffer.concat(chunks).toString()));
        }));

        if(!body.method) {
            throw new Error("Body missing `method` property.");
        }

        if(!this[body.method]) {
            throw new Error(`Bot does not have method \`${body.method}\`.`);
        }

        return {
            body: {
                data: await this[body.method].apply(this, body.args)
            }
        };
    }
}