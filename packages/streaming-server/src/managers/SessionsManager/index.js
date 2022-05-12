export default class SessionsManager {
    constructor() {
        this.sessions = {}
        this.publicStreams = []
    }

    newSession = (id, session) => {
        this.sessions[id] = session
    }

    getSession = (id) => {
        return this.sessions[id]
    }

    removeSession = (id) => {
        this.sessions[id].reject()

        delete this.sessions[id]
    }

    publishStream = (payload) => {
        if (typeof payload !== "object") {
            throw new Error("Payload must be an object")
        }

        this.publicStreams.push(payload)
    }

    unpublishStream = (id) => {
        this.publicStreams = this.publicStreams.filter(stream => stream.id !== id)
    }
}