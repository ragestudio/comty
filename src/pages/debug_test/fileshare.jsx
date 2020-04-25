import React from 'react'
import randomstring from 'randomstring'
import Peer from 'peerjs'

export default class extends React.PureComponent{
    constructor(props){
        super(props),
        this.state={
			peer: new Peer(),
			my_id: null,
			peer_id: null,
			initialized: false,
			files: []
        }
    }
    componentWillMount(){
		this.state.peer.on('open', (id)=>{
			console.log('My peer ID is: ' + id);
			this.setState({
				my_id: id,
				initialized: true
			})
		})
		this.state.peer.on('connection', (connection) => {
			console.log('New Connected')
			console.log(connection)
			this.setState({
				conn: connection
			}, () => {
				this.state.conn.on('open', this.on)
			})
		})
    }
    componentWillUnmount(){

    }
    connect(){

    }
    sendFile(){

    }
    onReceiveData(){
		
	}
	addFile(){

	}
	handleTextChange(){

	}
    render(){
        return(
            <div>__ RENDER</div>
        )
	}
	renderNotConnected(){

	}
	renderConnected(){

	}
	renderListFiles(){

	}
	renderNoFiles(){

	}
	renderFile(){
		
	}
}
