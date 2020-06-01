import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import * as app from 'app'
import styles from './spotify_player.less'

export default class Spotify_player extends React.PureComponent{

    state = {
        room_id: null,
        niga: false,
        styleMariaguno: { color: "green" },
        styleJoto: { color: "blue" }

    }

    componentDidMount(){
        const { room_id } = this.props
        if (room_id) { this.setState({ room_id: room_id })}
        
    }

    render(){
        const { niga, styleMariaguno, styleJoto } = this.state

        const toogleMariaguana = () => {
            this.setState({ niga: !niga })
            
        }

        return( 
        <div>
            <h3 style={ niga? styleMariaguno : styleJoto } >Seccion id: {this.state.room_id}</h3>
            <antd.Button onClick={() => toogleMariaguana()} > Mariguano MODO </antd.Button>
        </div>
        )
    }
}