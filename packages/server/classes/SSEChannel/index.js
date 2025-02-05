import EventEmitter from "@foxify/events"

export default class SSEChannel {
    constructor(params) {
        this.id = params.id
    }

    eventBus = new EventEmitter()

    clients = new Set()

    cache = []
}