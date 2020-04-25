import React from 'react'
import * as ycore from 'ycore'
import Peer from 'peerjs'

var lastPeerId = null;
var peer = new Peer
var peerId = null;
var conn = null;

function addMessage(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());
    var s = addZero(now.getSeconds());

    if (h > 12)
        h -= 12;
    else if (h === 0)
        h = 12;

    function addZero(t) {
        if (t < 10)
            t = "0" + t;
        return t;
    };

    message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
}



function putStatus(key){
    if(!key)return false
    window.ChatClass.setState({ status: key })
}
function putID(key){
    if(!key)return false
    window.ChatClass.setState({ ssid: key })
}
export default class Chats extends React.PureComponent{
    constructor(props){
        super(props),
        this.state = {
            ssid: null,
            loading: true,
            status: "Init...",
            _d: null
        }
        window.ChatClass = this
    }



    async __init (){
        const userData = await ycore.userData()
        this.setState({ _d: userData, loading: false })
        console.log(this.state._d)
       
        peer.on('open', function (id) {
            // Workaround for peer.reconnect deleting previous id
            if (peer.id === null) {
                console.log('Received null id from peer open');
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }
            putID(peer.id)
            putStatus("Awaiting connection...")
        });
        peer.on('connection', function (c) {
            // Allow only a single connection
            if (conn) {
                c.on('open', function() {
                    c.send("Already connected to another client");
                    setTimeout(function() { c.close(); }, 500);
                });
                return;
            }

            conn = c;
            console.log("Connected to: " + conn.peer);
            putStatus("Connected...")
            window.ChatClass.ready();
        });
        peer.on('disconnected', function () {
            window.ChatClass.setState({ status: 'Connection lost. Please reconnect' })
            console.log('Connection lost. Please reconnect');

            // Workaround for peer.reconnect deleting previous id
            peer.reconnect();
        });
        peer.on('close', function() {
            conn = null;
            putStatus("Connection Destroyed...")
            console.log('Connection destroyed');
        });
        peer.on('error', function (err) {
            console.log(err);
            alert('' + err);
        });
    }

   ready() {
       conn.on('data', function (data) {
           console.log("Data recieved");
           var cueString = "<span class=\"cueMsg\">Cue: </span>";
           switch (data) {
               case 'Go':
                   go();
                   addMessage(cueString + data);
                   break;
               case 'Fade':
                   fade();
                   addMessage(cueString + data);
                   break;
               case 'Off':
                   off();
                   addMessage(cueString + data);
                   break;
               case 'Reset':
                   reset();
                   addMessage(cueString + data);
                   break;
               default:
                   addMessage("<span class=\"peerMsg\">Peer: </span>" + data);
                   break;
           };
       });
       conn.on('close', function () {
            putStatus("Connection reset...")
            conn = null;
            start(true);
       });
   }

    componentDidMount(){
       this.__init()
    }
    render(){
        const { _d, loading } = this.state
        if (loading) return null
        return(
            <div>
                <h1> Proto IRC </h1>
                <h3> Status: {this.state.status}  |  SSID: {this.state.ssid} </h3>

            </div>
        )
    }
}