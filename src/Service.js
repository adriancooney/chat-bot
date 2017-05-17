export default class Service {
    update(PersonUpdate) {
        throw new Error("Not yet implemented by server");
    }

    updateHandle(PersonHandle) {
        throw new Error("Not yet implemented by server");
    }

    updateMessage(MessageIdentifer, MessageUpdate) {
        throw new Error("Not yet implemented by server");
    }

    createPerson(Person) {
        throw new Error("Not yet implemented by server");
    }

    getPerson(PersonIdentifier) {
        throw new Error("Not yet implemented by server");
    }

    getPersonByHandle(PersonHandle) {
        throw new Error("Not yet implemented by server");
    }

    getAllPeople() {
        throw new Error("Not yet implemented by server");
    }

    updatePerson(PersonIdentifier, PersonUpdate) {
        throw new Error("Not yet implemented by server");
    }

    addPersonToRoom(Person, RoomIdentifer) {
        throw new Error("Not yet implemented by server");
    }

    removePersonFromRoom(PersonIdentifier, RoomIdentifer) {
        throw new Error("Not yet implemented by server");
    }

    removePerson(PersonIdentifier) {
        throw new Error("Not yet implemented by server");
    }

    sendMessageToPerson(PersonIdentifier, Message|String) {
        throw new Error("Not yet implemented by server");
    }

    createRoom(Room) {
        throw new Error("Not yet implemented by server");
    }

    getRoom(RoomIdentifer) {
        throw new Error("Not yet implemented by server");
    }

    getRoomPeople(RoomIdentifer) {
        throw new Error("Not yet implemented by server");
    }

    getRoomWithPeople(Person[]) {
        throw new Error("Not yet implemented by server");
    }

    getRoomByTitle(RoomTitle) {
        throw new Error("Not yet implemented by server");
    }

    getAllRooms() {
        throw new Error("Not yet implemented by server");
    }

    updateRoom(RoomIdentifer, RoomUpdate) {
        throw new Error("Not yet implemented by server");
    }

    updateRoomTitle(RoomIdentifer, RoomTitle) {
        throw new Error("Not yet implemented by server");
    }

    removeRoom(RoomIdentifer) {
        throw new Error("Not yet implemented by server");
    }

    sendMessageToRoom(RoomIdentifer, Message|String) {
        throw new Error("Not yet implemented by server");
    }

    typing(boolean) {
        throw new Error("Not yet implemented by server");
    }
}