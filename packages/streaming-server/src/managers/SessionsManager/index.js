import lodash from "lodash"

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

    unpublishStream = (stream_key) => {
        this.publicStreams = this.publicStreams.filter(stream => stream.stream_key !== stream_key)
    }

    getPublicStreams = () => {
        // return this.publicStreams but without stream_key property
        return lodash.map(this.publicStreams, stream => {
            return lodash.omit(stream, "stream_key")
        })
    }

    getStreamsByUserId = (user_id) => {
        return lodash.filter(this.publicStreams, stream => stream.user_id === user_id)
    }
}