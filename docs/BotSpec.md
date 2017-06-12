# Bot Specification

```js
type PersonIdentifier = <service specific>;
type PersonHandle = <service specific>;

type RoomIdentifer = <service specific>;
type RoomTitle = <service specific>;

type MessageIdentifer = <service specific>;
type MessageContent = <service specific>;

type Room = {
    id: RoomIdentifer,
    title: RoomTitle,
    ...
};

type Person = {
    id: PersonIdentifier,
    handle: PersonHandle,
    firstName: string,
    lastName: string,
    ...
};

type Message = {
    id: MessageIdentifer,
    content: MessageContent,
    author: Person,
    source: Person|Room,
    mentions: {
        startIndex: number,
        endIndex: number,
        handle: string
    }[]
    ...
};

type RoomUpdate = { title: RoomTitle, ... };
type PersonUpdate = { handle: RoomTitle, ... };
type MessageUpdate = { content: MessageContent, ... };

type Results<T> = {
    results: T,
    page: int,  // The current page
    total: int  // The total amount of pages
}

type Target = Room | Person;

interface Service {
    type: string; // The name of the server e.g. "Teamwork Chat" or "Twitter"

    // Mandatory
    getCurrentUser()
    update(PersonUpdate): Promise<Person>;
    updateHandle(PersonHandle): Promise<Person>;
    updateMessage(MessageIdentifer, MessageUpdate): Promise;
    createPerson(PersonUpdate): Promise<Person>;
    getPerson(PersonIdentifier): Promise<Person>;
    getPersonByHandle(PersonHandle): Promise<Person>;
    getPeople(page: int): Promise<Results<Person[]>;
    updatePerson(PersonIdentifier, PersonUpdate): Promise<Person>
    addPersonToRoom(PersonIdentifier, RoomIdentifer): Promise;
    removePersonFromRoom(PersonIdentifier, RoomIdentifer): Promise;
    removePerson(PersonIdentifier): Promise;
    sendMessageToPerson(PersonIdentifier, Message|String): Promise<Message>;

    createRoom(RoomUpdate): Promise<Room>;
    getRoom(RoomIdentifer): Promise<Room>;
    getRoomPeople(RoomIdentifer): Promise<Person[]>;
    getRoomWithPeople(Person[]): Promise<Room>;
    getRoomByTitle(RoomTitle): Promise<Room>;
    getAllRooms(): Promise<Room[]>;
    updateRoom(RoomIdentifer, RoomUpdate): Promise<Room>;
    updateRoomTitle(RoomIdentifer, RoomTitle): Promise<Room>;
    removeRoom(RoomIdentifer): Promise;
    sendMessageToRoom(RoomIdentifer, Message|String): Promise;
    reply(Message, Message|String); // Given a received message, send a message to the received message source (i.e. room or private message)
    getMessagesForRoom(RoomIdentifer, page: int): Promise<Results<Message[]>>;

    // Questionable
    getRoomsForPerson(PersonIdentifier): Promise<Rooms[]>;

    // Reflection
    isRoom(Any): boolean;
    isPerson(Any): boolean;
    isMessage(Any): boolean;

    // Formatters and selectors
    formatMention(Person): String; // Format a person's handle to say e.g. @dwight

    // Optional
    typing(boolean): Promise;

    // Added by the Service base class
    sendMessage(Room|Person, Message|String); // Convienance for `sendMessageToRoom` and `sendMessageToPerson`
}
```

Errors:

```js
type ServiceError = Error;
type UnsupportedError = ServiceError; // If the service doesn't support this function.
type NotYetImplementedError = ServiceError; // Service has not implemented this method yet
type PermissionError = ServiceError; // The currently logged in user does not have permission to perform an action
type NotFoundError = ServiceError; // Generic item not found error
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
* All entities must be serializable to JSON (and deserializable).