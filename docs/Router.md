# Rules
A rule is a function that returns a configured transformer (or predicate) function. The transformer function takes a message object and determines if the rule matches the message object. The transformer can return the following types of values:

1. `boolean`: `true` meaning the input passes the rules expectation, `false` meaning the input does not meet expectations and no children of the rule will be descended.
2. `object`: Returning an object means the rule matches the input message object and that the returned object describes a mutation to the input message object that it's child rules should receive. The returned object is `Object.assign({}, message, transform)` and the new message object passed down to child rules.
3. `string`: Is a shortcut for returning `{ content: <string> }` (see #2).

**Important: transformer functions should not mutate the passed message object directly! This will have unintended consequences. Return a mutation object that will be applied to the message object.**

Rules can have the following optional properties (or `props`):

1. `action`: This is an action (`string` that's converted to `{ type: <string>, payload: <message> }`, an action `object` or sync function that takes `message` and returns an action `object`) to dispatch if the rule matches.
2. `handler`: Delegate the action dispatch (if any) to a handler. This handler receives a `message` object as it's first parameter, the current `state` as the second and a `dispatch` function as the third to dispatch actions.

# Process
1. wait for message
2. action = router(message)
3. nextState = reduce(state, action)
4. transition(nextState, state)
5. state = nextState
6. router = render(state)