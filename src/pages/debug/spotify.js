import React from 'react'
import * as antd from 'antd'
import { Players } from 'components'
import * as Icons from 'components/Icons'
import * as app from 'app'

export default class Spotify extends React.PureComponent{
    constructor(props){
        super(props)
        this.state =  {
            active: false,
            tmp_id: null,
            room_id: null
        }
    }

    handleJoinRoom(id){
        this.setState({ room_id: id, active: true })

    }

    handleCreateRoom(){

    }
    
    render(){
        const { active, room_id } = this.state
        const handleSesID = (e) => { this.setState({ tmp_id: e.target.value }) }
        const joinRoom = () => { 
            this.handleJoinRoom(this.state.tmp_id)
        }
        const createRoom = e => { 

        }

        if (active && room_id) return <Players.Spotify_player room_id={ this.state.room_id }/> 
        return(
            <>
            <h1>Spotifyfy Debug NIgaa 1200% 140p download PUNJABI 🐷🐷🐷🐷 halal verifedº</h1><hr/>
            <div>
                Join <antd.Input placeholder="Mete el codigo, maricon" onChange={handleSesID} />
                <antd.Button type="primary" onClick={()=> joinRoom()} > Join </antd.Button>
            </div>
         </>
        )
    }
}