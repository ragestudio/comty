import io from 'socket.io-client'
import verbosity from 'core/libs/verbosity'
import settings from 'core/libs/settings'
import { notify } from 'core/libs/appInterface'

export default class SocketConnection{
    ioConn: any
    state: { connAttemps: number; registeredNamespaces: any; }
    props: any
    opts: any

    constructor(props:any){
        if (!props) {
            throw new Error("Mmm some props are not defined")
        }
        this.props = props.payload
        this.dispatcher = props.connector

        this.state = {
            connAttemps: Number(0),
            registeredNamespaces: []
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

        if (typeof(this.props) !== "undefined") {
            this.opts = { ...this.opts, ...this.props}
        }

        verbosity([`New socket connection, with parameters =>`, this.opts], { color: "blue" })
        this.ioConn = io(this.opts.hostname, this.opts)

        
        this.ioConn.on('connect', (event:any) => {
            notify.success("You are now online")
            verbosity("Successfully connect")
            props.then(true) // this send an signal when the socket its successfully connected
        })
        
        this.ioConn.on("connect_error", (event:any) => {
            if (this.state.connAttemps >= this.opts.reconnectionAttempts) {
                verbosity(['Maximun nº of attemps reached => max', this.opts.reconnectionAttempts + 1])
                this.ioConn.close()
                return false
            }
            verbosity([`Strike [${this.state.connAttemps + 1}] / ${this.opts.reconnectionAttempts + 1} !`, event])
            this.state.connAttemps = this.state.connAttemps + 1
        })

        this.ioConn.on('reconnect', (attemptNumber:number) => {
            verbosity(["Connection reconected with (", attemptNumber , ") tries"])
            notify.success("You are now online")
        })
        
        this.ioConn.on('disconnected', () => {
            notify.warn("You are offline")
        })

        this.ioConn.on('error', (event:any) => {
            notify.error(event)
        })

        this.ioConn.on('close', () => {
            verbosity("Connection closed!")
        })
        
        this.ioConn.on('updateState', (event:any) => {
            verbosity(["updating state > ", event])
            this.dispatcher({ type: "socket/updateState", payload: event })
        })

        this.ioConn.on('pingPong', (e:any) => {
            // woops
            const n = e + 1
            const fart = new Audio("https://dl.ragestudio.net/pedo_cum.mp3")
            fart.play()
			setTimeout(() => { this.ioConn.emit("pingPong", n) }, n)
        })
    }

}