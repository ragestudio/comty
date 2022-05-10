export default class SessionsManager {
    constructor() {
        this.sessions = {}
    }

    newSession = (id, session) => {
        this.sessions[id] = session
    }

    getSession = (id) => {
        return this.sessions[id]
    }

    removeSession = (id) => {
        delete this.sessions[id]
    }
}