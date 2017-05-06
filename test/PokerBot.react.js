import React from "react";
import ReactDOM from "react-dom";
import PokerBot from "../src/PokerBot";

ReactDOM.render((
    <div>
        <PokerBot moderator={10} room={1} participants={[1, 2, 3]} />
    </div>
), document.getElementById("app"));