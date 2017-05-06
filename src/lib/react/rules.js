import React from "react";
import { omit } from "lodash";

export const Rule = React.createElement;
export const Command = rule("Command");
export const From = rule("From");
export const Default = rule("Default");
export const Mention = rule("Mention");
export const Match = rule("Match");
export const Private = rule("Private");

function rule(type) {
    return props => {
        return (
            <div>
                <span>{type} { JSON.stringify(omit(props, "children")) }</span>
                { props.children }
            </div>
        );
    };
}