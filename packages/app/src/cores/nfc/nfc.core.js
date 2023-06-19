import Core from "evite/src/core"
import TapShareDialog from "components/TapShare/Dialog"

export default class NFC extends Core {
    static refName = "NFC"

    static namespace = "nfc"

    instance = null

    subscribers = []

    public = {
        incompatible: null,
        scanning: false,
        instance: function () { return this.instance }.bind(this),
        subscribe: this.subscribe.bind(this),
        unsubscribe: this.unsubscribe.bind(this),
    }

    async onInitialize() {
        if ("NDEFReader" in window === false) {
            return this.public.incompatible = true
        }

        this.instance = new NDEFReader()

        try {
            navigator.permissions.query({ name: "nfc" })

            this.instance.scan()

            this.public.scanning = true
            this.public.incompatible = false

            this.registerEventListeners()
        } catch (error) {
            this.public.scanning = false
            this.public.incompatible = true

            console.error(error)
        }
    }

    subscribe(callback) {
        this.subscribers.push(callback)

        console.debug(`[NFC] SUBSCRIBED >`, this.subscribers.length)
    }

    unsubscribe(callback) {
        this.subscribers = this.subscribers.filter((subscriber) => {
            return subscriber !== callback
        })

        console.debug(`[NFC] UNSUBSCRIBED >`, this.subscribers.length)
    }

    handleRead(tag) {
        console.debug(`[NFC] READ >`, tag)

        // send to subscribers
        this.subscribers.forEach((subscriber) => {
            subscriber(null, tag)
        })

        console.log(this.subscribers)

        if (this.subscribers.length === 0) {
            if (tag.message.records?.length > 0) {
                // open dialog
                app.DrawerController.open("nfc_card_dialog", TapShareDialog, {
                    componentProps: {
                        tag: tag,
                    }
                })
            }
        }
    }

    handleError(error) {
        this.subscribers.forEach((subscriber) => {
            subscriber(error, null)
        })
    }

    registerEventListeners() {
        this.instance.addEventListener("reading", this.handleRead.bind(this))
        this.instance.addEventListener("error", this.handleError.bind(this))
    }
}