import io from 'socket.io-client'
import verbosity from 'core/libs/verbosity'
import settings from 'core/libs/settings'
import { notify } from 'core/libs/appInterface'

export default class SocketConnection {
    ioConn: any
    state: { connAttemps: number; registeredNamespaces: any; connectionState: any; listeners: any; }
    props: any
    opts: any
    dispatcher: any;

    constructor(props: any) {
        if (!props) {
            throw new Error("Mmm some props are not defined")
        }
        this.props = props.payload
        this.dispatcher = props.connector

        this.state = {
            listeners: {},
            connectionState: "init",
            connAttemps: Number(0),
            registeredNamespaces: [],
        }

        this.opts = {
            hostname: "localhost:5000",
            reconnection: true,
            reconnectionAttempts: Number(2),
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            timeout: 20000,
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

        this.ioConn = io(this.opts.hostname, this.opts)

        this.ioConn.handleUpdateState = (payload) => {
            this.state = { ...this.state, ...payload }
            this.dispatcher({ type: "socket/updateState", payload: this.state })
        }
        this.ioConn.handleUpdateListener = (listenerKey, toState) => {
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

            this.ioConn.handleUpdateState({ listeners: updatedState })
        }
        this.ioConn._emit = (...context) => {
            const listenerKey = context[0]
            if (typeof (this.state.listeners[listenerKey]) == "undefined") {
                this.ioConn.handleUpdateListener(listenerKey, true)
            }
            if (this.state.listeners[listenerKey] != null && !this.state.listeners[listenerKey]) {
                verbosity([`Listener [${listenerKey}] is broked!`])
                // setTimeout(() => {
                //     this.ioConn.handleUpdateListener(listenerKey)
                // }, 1000)
                return false
            }

            return this.ioConn.emit(...context)
        }


        this.ioConn.on('connect', (event: any) => {
            notify.success("You are now online")
            verbosity("Successfully connect")
            this.ioConn.handleUpdateState({ connectionState: "connected" })
            props.then(true) // this send an signal when the socket its successfully connected
        })

        this.ioConn.on("connect_error", (event: any) => {
            if (this.state.connAttemps >= this.opts.reconnectionAttempts) {
                verbosity(['Maximun nº of attemps reached => max', this.opts.reconnectionAttempts + 1])
                this.ioConn.close()
                return false
            }
            verbosity([`Strike [${this.state.connAttemps + 1}] / ${this.opts.reconnectionAttempts + 1} !`, event])
            this.state.connAttemps = this.state.connAttemps + 1
        })

        this.ioConn.on('reconnect', (attemptNumber: number) => {
            verbosity(["Connection reconected with (", attemptNumber, ") tries"])
            notify.success("You are now online")
            this.ioConn.handleUpdateState({ connectionState: "connected" })
        })

        this.ioConn.on('disconnected', () => {
            notify.warn("You are offline")
            this.ioConn.handleUpdateState({ connectionState: "disconnected" })
        })

        this.ioConn.on('error', (event: any) => {
            notify.error(event)
        })

        this.ioConn.on('close', () => {
            verbosity("Connection closed!")
            this.ioConn.handleUpdateState({ connectionState: "closed" })
        })

        this.ioConn.on('updateState', (event: any) => {
            this.ioConn.handleUpdateState(event)
        })
    }

}