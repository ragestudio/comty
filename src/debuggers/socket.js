import React from 'react'
import jwt from 'jsonwebtoken'
import io from 'socket.io-client'
import { connect } from 'umi'
import * as antd from 'antd'
import { __legacy__objectToArray } from 'core'
import settings from 'core/libs/settings'

const defaultSocketAddress = "localhost:7000"

@connect(({ app, socket }) => ({ app, socket }))
export default class SocketDebug extends React.Component {
    state = {
        resolvers: __legacy__objectToArray(this.props.app.resolvers),
        InputRaw: defaultSocketAddress
    }

    dispatchSocket(value) {
        this.props.dispatch({
            type: `socket/initializeSocket`,
            payload: {
                address: value
            }
        })
    }

    handleDisconnectSocket() {
        const socket = this.props.socket.socket_conn
        if (socket) {
            console.log("closing")
            socket.conn.close()
        }
    }

    render() {
        const { socket_opt } = this.props.socket
        return (
            <div>
                <antd.Card>
                    <h2>socket state</h2>
                    <antd.List
                        dataSource={__legacy__objectToArray(this.props.socket)}
                        renderItem={(e) => {
                            try {
                                const v = JSON.stringify(e.value)
                                if (!v) return false
                                return (
                                    <antd.Collapse>
                                        <antd.Collapse.Panel header={`${e.key} (${v.length}) characters`}>
                                            <div style={{ margin: '0 5px 15px 5px', wordBreak: "break-all" }} key={e.key} >
                                                <span>{v}</span>
                                            </div>
                                        </antd.Collapse.Panel>
                                    </antd.Collapse>
                                )
                            } catch (error) {
                                return <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", height: "47px", backgroundColor: "#d9d9d9" }} >
                                    This could not be rendered > ({e.key}) [{typeof(e.value)}]
                                </div>
                            }
                        }}
                    />
                </antd.Card>


                {socket_opt ?
                    <antd.Card>
                        <h2> socket_opt </h2>
                        <antd.List
                            grid={{
                                gutter: 5,
                                xxl: 3,
                            }}
                            dataSource={__legacy__objectToArray(socket_opt)}
                            renderItem={(e) => {
                                return (
                                    <div style={{ border: "0.1px rgb(217, 217, 217) solid", backgroundColor: "rgb(250, 250, 250)", borderRadius: "4px", width: "fit-content", paddingRight: "12px" }}>
                                        <antd.Tag>{e.key}</antd.Tag>{JSON.stringify(e.value)}
                                    </div>
                                )
                            }}
                        />
                    </antd.Card>
                    : null}

                <antd.Card>
                    <antd.Button onClick={() => this.dispatchSocket(this.state.InputRaw)} > Connect </antd.Button>
                    <antd.Button onClick={() => this.handleDisconnectSocket()} > Disconnect </antd.Button>
                    <antd.Button onClick={() => this.setState({ InputRaw: defaultSocketAddress })} > Set default </antd.Button>
                    <antd.Input onChange={(e) => this.setState({ InputRaw: e.target.value })} value={this.state.InputRaw} placeholder="ws:// http:// some.bruh:9090" />
                    <hr />
                </antd.Card>

            </div>
        )
    }
}