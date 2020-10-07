import React from 'react'
import jwt from 'jsonwebtoken'
import { uri_resolver } from 'api/lib'
import io from 'socket.io-client'
import { connect } from 'umi'
import * as antd from 'antd'
import { objectToArray } from 'core'
import settings from 'core/libs/settings'

const defaultSocketAddress = "85.251.59.39"

@connect(({ app }) => ({ app }))
export default class SocketDebug extends React.Component{
    state = {
        resolvers: objectToArray(this.props.app.resolvers),
        connNode: null,
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

    render(){
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

                connectedNode: {this.state.connNode}
                
                <antd.Card>
                    <antd.Button onClick={() => this.setState({ InputRaw: defaultSocketAddress })} > Set default </antd.Button>
                    <antd.Button onClick={() => this.dispatchSocket(this.state.InputRaw)} > connect </antd.Button>
                    <antd.Input onChange={(e) => this.setState({ InputRaw: e.target.value })} value={this.state.InputRaw} placeholder="ws:// http:// some.bruh:9090" />
                </antd.Card>
                        
            </div>
        )
    }
}