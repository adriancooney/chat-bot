import assert from "assert";
import { Component } from "react";
import Promise from "bluebird";
import Bot from "../Bot";

export default class ReactBot extends Component {
    constructor(props) {
        super(props);
        this.queue = [];
    }

    dispatch(...args) {
        return Bot.prototype.dispatch.call(this, ...args);
    }

    transition() {

    }

    handleMessage(message) {

    }

    sendMessage(message) {
        return Promise.resolve();
    }
}