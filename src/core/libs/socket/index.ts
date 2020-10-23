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
interface ioConnTypes {
    payload: any;
    listenerKey: string;
    toState: number;
    event: any;
    attempNumber: number;
    startTime: number;
}
export default class SocketConnection {
    ioConn: any
    state: {
        connAttemps: number;
        registeredNamespaces: any;
        connectionState: any;
        listeners: any;
        latency: any;
    }
    props: any
    opts: any
    dispatcher: any;
    then: any;
    namespaceConnector: any;

    constructor(props: any) {
        if (!props) {
            throw new Error("Mmm some props are not defined")
        }
        this.then = props.then
        this.props = props.payload
        this.dispatcher = props.connector

        this.state = {
            latency: 0,
            listeners: {},
            connectionState: "init",
            connAttemps: Number(0),
            registeredNamespaces: [],
        }

        this.opts = {
            namespaceOrigin: "/",
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
            extraHeaders: {}
        }

        if (typeof (this.props) !== "undefined") {
            this.opts = { ...this.opts, ...this.props }
        }

        this.createConnection().then(() => {
            this.ioConn.updateConnectionState(2)
            this.setConnectionListeners()
        })

        this.namespaceConnector = (namespace: string) => {
            this.createConnection(namespace).then(() => {
                this.ioConn.updateConnectionState(2)
                this.setConnectionListeners()
            })
        }
    }


    createConnection(namespace: void) {
        const getNode = () => {
            const defaultNode = `${this.opts.hostname}${this.opts.namespaceOrigin}`
            if (typeof (namespace) !== "undefined") {
                return `${this.opts.hostname}:${this.opts.port}${namespace}`
            }
            return defaultNode
        }
        return new Promise((resolve) => {
            this.ioConn = io(getNode(), this.opts)

            this.ioConn.updateState = (payload: ioConnTypes) => {
                this.state = { ...this.state, ...payload }
                const sendBackPayload = { ...this.state, ioConn: this.ioConn, namespaceConnector: this.namespaceConnector }
                this.dispatcher({ type: "socket/updateStateFromSocket", node: this.opts.namespaceOrigin, payload: sendBackPayload })
            }

            this.ioConn.updateListener = (listenerKey: ioConnTypes, toState: ioConnTypes) => {
                if (!listenerKey)
                    return false

                const getInvert = () => {
                    // @ts-ignore
                    if (this.state.listeners[listenerKey] != null) {
                        // @ts-ignore
                        return !this.state.listeners[listenerKey]
                    } else {
                        return true // this set activated listener by default if not exist any entries
                    }
                }
                let updatedObj: any = []
                // @ts-ignore
                updatedObj[listenerKey] = toState ?? getInvert()

                let updatedState = this.state.listeners
                updatedState = { ...updatedState, ...updatedObj }

                this.ioConn.updateState({ listeners: updatedState })
            }

            this.ioConn.updateConnectionState = (code: number) => {
                if (code != null && typeof (code) == "number") {
                    // @ts-ignore
                    if (this.state.connectionState !== stateCodes[code]) {  // avoiding update innecesary
                        // @ts-ignore
                        this.ioConn.updateState({ connectionState: stateCodes[code] })
                    }
                }
            }

            this.ioConn._emit = (...context: any) => {
                const listenerKey = context[0]
                if (typeof (this.state.listeners[listenerKey]) == "undefined") {
                    this.ioConn.updateListener(listenerKey, true)
                }
                if (this.state.listeners[listenerKey] != null && !this.state.listeners[listenerKey]) {
                    verbosity([`Listener [${listenerKey}] is broked!`], { color: "red" })
                    return false
                }

                return this.ioConn.emit(...context)
            }

            this.ioConn._close = () => {
                this.ioConn.disconnect()
                this.ioConn.updateConnectionState(0)
            }

            this.ioConn.destroy = () => {
                this.dispatcher({ type: "socket/destroyNode", node: this.opts.namespaceOrigin })
            }

            resolve(true)
        })
    }

    setConnectionListeners() {
        this.ioConn.on('connect', () => {
            this.ioConn.updateConnectionState(1)
            verbosity(["🔌 Connected to socket"])
            this.then(this.ioConn) // sending init data
        })

        this.ioConn.on("connect_error", (event: ioConnTypes) => {
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

        this.ioConn.on('reconnect', (attemptNumber: ioConnTypes) => {
            verbosity([`[socket_event] reconnect > Connection reconected with (${attemptNumber}) tries`])
            this.ioConn.updateConnectionState(1)
        })

        this.ioConn.on('disconnect', (event: ioConnTypes) => {
            verbosity([`[socket_event] disconnect >`, event])
            notify.warn("You are offline")
            this.ioConn.updateConnectionState(3)
        })

        this.ioConn.on('connect_timeout', () => {
            verbosity([`[socket_event] connect_timeout >`])
            this.ioConn.updateConnectionState(3)
        })

        this.ioConn.on('error', (event: ioConnTypes) => {
            verbosity([`[socket_event] error >`, event])
        })

        this.ioConn.on('updateState', (event: ioConnTypes) => {
            this.ioConn.updateState(event)
        })

        if (typeof (this.ioConn.io.opts.pingInterval) !== "undefined") {
            if (typeof (this.ioConn.io.opts.pingInterval) == "number") {
                setInterval(() => {
                    this.ioConn.emit('latency', Date.now(), (startTime: ioConnTypes) => {
                        // @ts-ignore
                        const latency = Date.now() - startTime
                        this.ioConn.updateState({ latency })
                    })
                }, this.ioConn.io.opts.pingInterval)
            }
        }
    }
}