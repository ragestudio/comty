import React from 'react'
import jwt from 'jsonwebtoken'
import { uri_resolver } from 'api/lib'
import io from 'socket.io-client'
import { connect } from 'umi'
import * as antd from 'antd'
import { objectToArray } from 'core'

@connect(({ app }) => ({ app }))
export default class SocketDebug extends React.Component{
    state = {
        resolvers: objectToArray(this.props.app.resolvers),
        connNode: null,
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
            </div>
        )
    }
}