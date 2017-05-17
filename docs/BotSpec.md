# Bot Specification

```js
type PersonIdentifier = <service specific>;
type PersonHandle = <service specific>;

type RoomIdentifer = <service specific>;
type RoomTitle = <service specific>;

type MessageIdentifer = <service specific>;
type MessageContent = <service specific>;

type Room = { id: RoomIdentifer, title: RoomTitle, ... };
type Person = { id: PersonIdentifier, handle: PersonHandle, ... };
type Message = { id: MessageIdentifer, content: MessageContent, ... };

type RoomUpdate = { title: RoomTitle, ... };
type PersonUpdate = { handle: RoomTitle, ... };
type MessageUpdate = { content: MessageContent, ... };

type Target = Room | Person;

interface Service {
    // Mandatory
    update(PersonUpdate): Promise<Person>;
    updateHandle(PersonHandle): Promise<Person>;
    updateMessage(MessageIdentifer, MessageUpdate);

    createPerson(Person): Promise<Person>;
    getPerson(PersonIdentifier): Promise<Person>;
    getPersonByHandle(PersonHandle): Promise<Person>;
    getAllPeople(): Promise<Person>;
    updatePerson(PersonIdentifier, PersonUpdate): Promise<Person>
    addPersonToRoom(Person, RoomIdentifer): Promise;
    removePersonFromRoom(PersonIdentifier, RoomIdentifer): Promise;
    removePerson(PersonIdentifier): Promise;
    sendMessageToPerson(PersonIdentifier, Message|String): Promise<Message>;

    createRoom(Room): Promise<Room>;
    getRoom(RoomIdentifer): Promise<Room>;
    getRoomPeople(RoomIdentifer): Promise<Person[]>;
    getRoomWithPeople(Person[]): Promise<Room>;
    getRoomByTitle(RoomTitle): Promise<Room>;
    getAllRooms(): Promise<Room[]>;
    updateRoom(RoomIdentifer, RoomUpdate): Promise<Room>;
    updateRoomTitle(RoomIdentifer, RoomTitle): Promise<Message>;
    removeRoom(RoomIdentifer): Promise;
    sendMessageToRoom(RoomIdentifer, Message|String): Promise;

    // Optional
    typing(boolean): Promise;
}
```

Creating a new service interface:

```js
export default class TeamworkChatInterface extends ServiceInterface {
    constructor(chat) {
        this.chat = chat;
    }

    update(person) {

    }
}
```

* A `Person` is a single user.
* A `Room` is a collection of people sending and recieving messages in the one space.