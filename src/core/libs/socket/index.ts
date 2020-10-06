import io from 'socket.io-client'
import { verbosityConsole } from 'core/libs/verbosity'
import { connect } from 'umi'
import settings from 'core/libs/settings'

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
            reconnectionAttempts: Infinity,
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
                verbosityConsole('Maximun nº of attemps reached => max', maxDeep_Attemp + 1)
                this.conn.close()
                return false
            }
            verbosityConsole(`Strike [${this.state.connAttemps + 1}] / ${maxDeep_Attemp + 1} !`)
            this.state.connAttemps = this.state.connAttemps + 1
            
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
            verbosity("Connection closed!")
            this.ioConn.close()
        },
        destroy: () => {
            
        }
    }

}