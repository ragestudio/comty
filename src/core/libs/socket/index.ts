import io from 'socket.io-client'
import { verbosity } from 'core/libs/verbosity'
import { connect } from 'umi'
import settings from 'core/libs/settings'
import { notify } from 'core/libs/appInterface'

const maxDeep_Attemp = Number(2)
export class SocketConnection{
    ioConn: any
    state: { address: any; connAttemps: number }
    props: any
    opts: any

    constructor(props:any){
        if (!props) {
            throw new Error("Mmm some props are not defined")
        }
        this.state = {
            address: props.address,
            connAttemps: Number(0)
        }

        this.props = props
        this.opts = {
            reconnection: true,
            reconnectionAttempts: maxDeep_Attemp,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            timeout: 20000,
            autoConnect: false,
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
        this.ioConn = io(this.state.address, this.opts)
        this.conn.open()

        this.ioConn.on("connect_error", () => {
            if (this.state.connAttemps >= maxDeep_Attemp) {
                verbosity(['Maximun nº of attemps reached => max', maxDeep_Attemp + 1])
                this.conn.close()
                return false
            }
            verbosity([`Strike [${this.state.connAttemps + 1}] / ${maxDeep_Attemp + 1} !`])
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

        this.ioConn.on('connect', () => {
            notify.success("You are now online")
            verbosity("Successfully connect")
        })

        this.ioConn.on('close', () => {
            verbosity("Connection closed!")
        })
        
        this.ioConn.on('pingPong', (e:any) => {
            // woops
            const n = e + 1
            const fart = new Audio("https://dl.ragestudio.net/pedo_cum.mp3")
            fart.play()
			setTimeout(() => { this.ioConn.emit("pingPong", n) }, n)
		})
        
    }
    
    conn = {
        open: () => {
            this.ioConn.open()
        },
        disconnect: () => {
            this.ioConn.disconnect()
        },
        close: () => {
            this.ioConn.close()
        },
        destroy: () => {
            
        }
    }

}