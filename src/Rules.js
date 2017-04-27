import {
    evolve,
    replace,
    test,
    prop,
    compose,
    cond,
    always,
    T, F,
    reduceWhile,
    identity, __,
    not, isNil,
    flip, call,
    when,
    dropLast, last,
    ifElse, is, and, or, has
} from "ramda";
import tt from "treis";

export function reduceMatchers(...matchers) {
    return reduceWhile(or(compose(not, isNil), isAction), flip(call), __, matchers);
}

export function any

export function rule(...matchers) {
    return reduceMatchers(...matchers);
}

export function action(action) {
    return always({ "Action": action });
}

export function isAction(action) {
    return and(is(Object), has("Action"));
}

export function regex(regex) {
    return ifElse(
        compose(test(regex), prop("content")),
        evolve({ content: replace(regex, "") }),
        always(null)
    );
}

export function immediateMention(handle) {
    return regex(new RegExp(`^@${handle}`));
}

export function command(name) {
    return regex(new RegExp(`\\s+${name}(?:\\s|$)`));
}

export function mentionCommand(handle, name) {
    return reduceMatchers(command(name), immediateMention(handle));
}