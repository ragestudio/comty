import React from 'react'
import jwt from 'jsonwebtoken'
import io from 'socket.io-client'
import { connect } from 'umi'
import * as antd from 'antd'
import { objectToArray } from 'core'
import settings from 'core/libs/settings'

const defaultSocketAddress = "localhost:7000"

@connect(({ app }) => ({ app }))
export default class SocketDebug extends React.Component{
    state = {
        resolvers: objectToArray(this.props.app.resolvers),
        InputRaw: defaultSocketAddress
    }

    dispatchSocket(value){
        this.props.dispatch({
            type: `${settings("app_model")}/initializeSocket`,
            payload: {
                address: value
            }         
        })
    }

    handleDisconnectSocket(){
        const socket = this.props.app.socket_conn
        if (socket) {
            console.log("closing")
            socket.conn.close()
        }
    }

    render(){
        const { socket_opt } = this.props.app
        return(
            <div>
                <antd.Card>
                    <antd.List 
                        dataSource={this.state.resolvers}
                        renderItem={(e) => {
                            return(
                                <div>
                                   * {e.key} => {e.value}
                                </div>
                            )
                        }}
                    />
                </antd.Card>

                {socket_opt?  
                     <antd.List 
                         grid={{
                           gutter: 5,
                           xxl: 3,
                         }}
                         dataSource={objectToArray(socket_opt)}
                         renderItem={(e) => {
                             return(
                                 <div style={{ border: "0.1px rgb(217, 217, 217) solid" ,backgroundColor: "rgb(250, 250, 250)", borderRadius: "4px", width: "fit-content", paddingRight: "12px" }}>
                                     <antd.Tag>{e.key}</antd.Tag>{JSON.stringify(e.value)}
                                 </div>
                             )
                         }}
                     />
                : null}
                
                <antd.Card>
                    <antd.Button onClick={() => this.dispatchSocket(this.state.InputRaw)} > Connect </antd.Button>
                    <antd.Button onClick={() => this.handleDisconnectSocket()} > Disconnect </antd.Button>
                    <antd.Input onChange={(e) => this.setState({ InputRaw: e.target.value })} value={this.state.InputRaw} placeholder="ws:// http:// some.bruh:9090" />
                    <antd.Button onClick={() => this.setState({ InputRaw: defaultSocketAddress })} > Set default </antd.Button>
                </antd.Card>
                        
            </div>
        )
    }
}