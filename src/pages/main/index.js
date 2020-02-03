import React from 'react'
import * as antd from 'antd'
import * as ycore from 'ycore'
import {PostCard} from 'components'

var userData = ycore.SDCP()


class Main extends React.Component {
    renderUserSDCP() {
        const rep = [userData].map((item)=> {return JSON.stringify(item)})
        return (
        <antd.Comment
            author={'Data'}
            content={rep}
      />
      )
    }
    render(){
        const paylodd = {user: userData.username, ago: 'Hace 1 Segundo', avatar: userData.avatar, content: 'Hola buenas adios buenas'}
        return (
            <div>   
                <PostCard  payload={paylodd} />
            </div>
        )
    }
}
export default Main;