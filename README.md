# Message Spec
```json
{
    "content": "Hello world!",
    "timestamp": "2017-05-07T23:02:45.120Z",
    "author": {
        "id": 1,
        "handle": "adrianc",
        "firstName": "Adrian",
        "lastName": "Cooney"
    },
    "source": {
        "room": {
            "id": 1,
            "title": "Soccer Mondays!"
        },

        // or private message (i.e. from author)
        "private": true
    }
}
```

# Bin

```sh
$ chat-bot --bridge teamwork-chat --
```