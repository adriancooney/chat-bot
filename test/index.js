import {
    handleMessage
} from "../src";

describe("chat-redux", () => {
    it("should handle an incoming message", () => {
        return handleMessage({
            content: "@bot plan http://digitalcrew.teamwork.com",
            author: {
                id: 1,
                handle: "adrianc"
            },
            room: {
                id: 10,
                title: "Chat Team"
            }
        });
    });
});