The message router needs to be expressive. Here are some examples:

> Matches only *private* messages from certain people (users with ids 1 and 2) that is of the form `@bot poker`

```js
match(from([ 1, 2 ]), private, direct("bot"), command("poker"));

// Other was
match(private, from([ 1, 2 ]), exactly("@bot poker"))
```

## React like structure

```js
<Mention handle="bot">
    <Command name="poker" action={startPoker} />
</Mention>

<Private>
    <From users={[1, 2]}>

    </From>
</Private>
```
