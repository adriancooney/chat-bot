import PokerBot from "../src/bot-example-object.js";

describe("PokerBot", () => {
    it("should handle a message appropriately", () => {
        const bot = new PokerBot();

        console.log(bot);

        return bot.handleMessage(message("+1"));
    });
});

function message(content, overrides) {
    return Object.assign({
        content,
        private: false,
        room: 10,
        author: 1
    }, overrides);
}