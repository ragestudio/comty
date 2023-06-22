import Core from "evite/src/core"
import TapShareDialog from "components/TapShare/Dialog"

const RecordTypes = {
    "T": "text",
    "U": "url"
}

function decodePayload(record) {
    let recordType = nfc.bytesToString(record.type)

    let payload = {
        recordId: nfc.bytesToHexString(record.id),
        recordType: RecordTypes[recordType],
        data: null
    }

    switch (recordType) {
        case "T": {
            let langCodeLength = record.payload[0]

            payload.data = record.payload.slice((1 + langCodeLength), record.payload.length)

            payload.data = nfc.bytesToString(text)

            break
        }
        case "U": {
            let identifierCode = record.payload.shift()

            payload.data = nfc.bytesToString(record.payload)

            switch (identifierCode) {
                case 4: {
                    payload.data = `https://${payload.data}`
                    break
                }
                case 3: {
                    payload.data = `http://${payload.data}`
                    break
                }
            }

            break
        }
        default: {
            payload.data = nfc.bytesToString(record.payload)
            break
        }
    }

    return payload
}

function resolveSerialNumber(tag) {
    let serialNumber = null

    serialNumber = nfc.bytesToHexString(tag.id)

    // transform serialNumber to contain a ":" every 2 bytes
    serialNumber = serialNumber.replace(/(.{2})/g, "$1:")

    // remove the last :
    serialNumber = serialNumber.slice(0, -1)

    return serialNumber
}

function parseNdefMessage(ndefMessage) {
    let message = []

    ndefMessage.forEach((ndefRecord) => {
        message.push(decodePayload(ndefRecord))
    })

    return message
}

export default class NFC extends Core {
    static refName = "NFC"

    static namespace = "nfc"

    isNativeMode = false

    instance = null

    subscribers = []

    public = {
        incompatible: true,
        scanning: false,
        writeNdef: this.writeNdef.bind(this),
        instance: function () { return this.instance }.bind(this),
        subscribe: this.subscribe.bind(this),
        unsubscribe: this.unsubscribe.bind(this),
    }

    subscribe(callback) {
        // check if scan service is available, if not try to initialize
        if (this.public.scanning === false) {
            this.startScanning()
        }

        this.subscribers.push(callback)
    }

    unsubscribe(callback) {
        this.subscribers = this.subscribers.filter((subscriber) => {
            return subscriber !== callback
        })
    }

    async onInitialize() {
        if (window.nfc) {
            this.instance = window.nfc

            this.isNativeMode = true

            return this.startNativeScanning()
        }

        if ("NDEFReader" in window) {
            this.instance = new NDEFReader()

            return this.startScanning()
        }

        return this.public.incompatible = true
    }

    async startScanning() {
        try {
            await this.instance.scan()

            this.public.scanning = true
            this.public.incompatible = false

            this.registerEventListeners()
        } catch (error) {
            this.public.scanning = false
            this.public.incompatible = true

            console.error(error)
        }
    }

    startNativeScanning() {
        this.public.scanning = true
        this.public.incompatible = false

        return this.registerNativeEventListeners()
    }

    handleRead(tag) {
        console.debug(`[NFC] READ >`, tag)

        // send to subscribers
        this.subscribers.forEach((subscriber) => {
            subscriber(null, tag)
        })

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

    handleNativeRead(tag) {
        console.debug(`[NFC] NATIVE READ >`, tag)

        tag.serialNumber = resolveSerialNumber(tag)

        if (tag.ndefMessage) {
            tag.message = {}
            tag.message.records = parseNdefMessage(tag.ndefMessage)
        }

        this.subscribers.forEach((subscriber) => {
            subscriber(null, tag)
        })

        if (this.subscribers.length === 0 && tag.message?.records) {
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

    registerNativeEventListeners() {
        nfc.addTagDiscoveredListener(
            (e) => this.handleNativeRead(e.tag),
            () => {
                this.public.scanning = true
                this.public.incompatible = false
            },
            this.handleError
        )

        nfc.addNdefListener(
            (e) => this.handleNativeRead(e.tag),
            () => {
                this.public.scanning = true
                this.public.incompatible = false
            },
            this.handleError
        )
    }

    async writeNdef(payload, options) {
        console.debug(`[NFC] WRITE >`, payload)

        if (!this.isNativeMode) {
            return this.instance.write(payload, options)
        }

        let message = []

        const { records } = payload

        if (!Array.isArray(records)) {
            throw new Error("records must be an array")
        }

        for (const record of records) {
            switch (record.recordType) {
                case "text": {
                    message.push(ndef.textRecord(record.data))
                    break
                }
                case "url": {
                    message.push(ndef.uriRecord(record.data))
                    break
                }
            }
        }

        return await new Promise((resolve, reject) => {
            this.instance.write(message, resolve, reject)
        })
    }
}