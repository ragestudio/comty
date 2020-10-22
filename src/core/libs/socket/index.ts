import io from 'socket.io-client'
import verbosity from 'core/libs/verbosity'
import settings from 'core/libs/settings'
import { notify } from 'core/libs/appInterface'

const stateCodes = {
    0: "closed",
    1: "connected",
    2: "connecting",
    3: "disconnected"
}

export default class SocketConnection {
    ioConn: any
    state: { connAttemps: number; registeredNamespaces: any; connectionState: any; listeners: any; latency: any; namespace: any; }
    props: any
    opts: any
    dispatcher: any;
    namespaceConnector: (namespace: any) => void

    constructor(props: any) {
        if (!props) {
            throw new Error("Mmm some props are not defined")
        }
        this.props = props.payload
        this.dispatcher = props.connector

        this.state = {
            namespace: "/",
            latency: 0,
            listeners: {},
            connectionState: "init",
            connAttemps: Number(0),
            registeredNamespaces: [],
        }

        this.opts = {
            hostname: "localhost:5000",
            port: "5000",
            reconnection: true,
            reconnectionAttempts: Number(2),
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            timeout: 20000,
            pingInterval: 5000,
            autoConnect: true,
            query: {},
            // options of the Engine.IO client
            upgrade: true,
            forceJSONP: false,
            jsonp: true,
            forceBase64: false,
            enablesXDR: false,
            timestampRequests: true,
            timestampParam: 't',
            policyPort: 843,
            transports: ['polling', 'websocket'],
            transportOptions: {},
            rememberUpgrade: false,
            onlyBinaryUpgrades: false,
            requestTimeout: 0,
            protocols: [],
            // options for Node.js
            agent: false,
            pfx: null,
            key: null,
            passphrase: null,
            cert: null,
            ca: null,
            ciphers: [],
            rejectUnauthorized: true,
            perMessageDeflate: true,
            forceNode: false,
            localAddress: null,
            // options for Node.js / React Native
            extraHeaders: {},
        }

        if (typeof (this.props) !== "undefined") {
            this.opts = { ...this.opts, ...this.props }
        }

        this.createConnection().then((e) => {
            this.ioConn.updateConnectionState(2)
            this.setConnectionListeners()
        })

    }

    createConnection(namespace) {
        const getNamespace = () => {
            console.log(this.opts.hostname)

            if (typeof (namespace) !== "undefined") {
                return namespace
            }
            return this.opts.hostname
        }
        return new Promise((resolve) => {
            console.log(getNamespace())
            this.ioConn = io(getNamespace(), this.opts)

            this.ioConn.updateState = (payload) => {
                this.state = { ...this.state, ...payload }
                this.dispatcher({ type: "socket/updateState", payload: this.state })
            }

            this.ioConn.updateListener = (listenerKey, toState) => {
                if (!listenerKey)
                    return false

                const getInvert = () => {
                    if (this.state.listeners[listenerKey] != null) {
                        return !this.state.listeners[listenerKey]
                    } else {
                        return true // this set activated listener by default if not exist any entries
                    }
                }
                let updatedObj = []
                updatedObj[listenerKey] = toState ?? getInvert()

                let updatedState = this.state.listeners
                updatedState = { ...updatedState, ...updatedObj }

                this.ioConn.updateState({ listeners: updatedState })
            }

            this.ioConn.updateConnectionState = (code) => {
                if (code != null && typeof (code) == "number") {
                    // @ts-ignore
                    if (this.state.connectionState !== stateCodes[code]) {  // avoiding update innecesary
                        this.ioConn.updateState({ connectionState: stateCodes[code] })
                    }
                }
            }

            this.ioConn._emit = (...context) => {
                const listenerKey = context[0]
                if (typeof (this.state.listeners[listenerKey]) == "undefined") {
                    this.ioConn.updateListener(listenerKey, true)
                }
                if (this.state.listeners[listenerKey] != null && !this.state.listeners[listenerKey]) {
                    verbosity([`Listener [${listenerKey}] is broked!`], { color: "red" })
                    // setTimeout(() => {
                    //     this.ioConn.updateListener(listenerKey)
                    // }, 1000)
                    return false
                }

                return this.ioConn.emit(...context)
            }

            resolve(true)
        })
    }

    setConnectionListeners() {
        this.ioConn.on('connect', (event: any) => {
            notify.success("You are now online")
            verbosity("Connected to socket", event)
            this.ioConn.updateConnectionState(1)
        })

        this.ioConn.on("connect_error", (event: any) => {
            if (this.state.connectionState !== "connecting") {
                this.ioConn.updateConnectionState(2)
            }
            if (this.state.connAttemps >= this.opts.reconnectionAttempts) {
                verbosity(['Maximun nº of attemps reached => max', this.opts.reconnectionAttempts + 1])
                this.ioConn.updateConnectionState(0)
                return false
            }
            verbosity([`Strike [${this.state.connAttemps + 1}] / ${this.opts.reconnectionAttempts + 1} !`, event])
            this.state.connAttemps = this.state.connAttemps + 1
        })

        this.ioConn.on('reconnect', (attemptNumber: number) => {
            verbosity(["Connection reconected with (", attemptNumber, ") tries"])
            notify.success("You are now online")
            this.ioConn.updateConnectionState(1)
        })

        this.ioConn.on('disconnect', (event) => {
            verbosity([`Disconnected from socket >`, event])
            notify.warn("You are offline")
            this.ioConn.updateConnectionState(3)
        })

        this.ioConn.on('connect_timeout', () => {
            notify.warn("Connection timeout")
            this.ioConn.updateConnectionState(3)
        })

        this.ioConn.on('error', (event: any) => {
            verbosity([`New error from socket >`, event])
        })

        this.ioConn.on('updateState', (event: any) => {
            this.ioConn.updateState(event)
        })

        if (typeof (this.ioConn.io.opts.pingInterval) !== "undefined") {
            if (typeof (this.ioConn.io.opts.pingInterval) == "number") {
                setInterval(() => {
                    this.ioConn.emit('latency', Date.now(), (startTime) => {
                        const latency = Date.now() - startTime
                        this.ioConn.updateState({ latency })
                    })
                }, this.ioConn.io.opts.pingInterval)
            }
        }
    }

}