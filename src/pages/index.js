import React from 'react'
import ReduxDebugger from 'debuggers/redux'
import * as antd from 'antd'
import { FloatComponent } from 'components'
import { connect } from 'umi'
import * as Icons from 'components/Icons'
import { __legacy__objectToArray } from 'core'

@connect((store) => (store))
export default class Index extends React.Component {
    state = {
        mainNode: "/"
    }

    handleDispatchNamespace(key) {
        console.log(`Dispatching socket namespace (${key})`)
        this.props.dispatch({
            type: "socket/namespaceConnector",
            node: this.state.mainNode,
            namespace: key
        })
    }

    render() {
        const dispatch = this.props.dispatch
        const { connectionState, latency } = this.props.socket.nodes[this.state.mainNode]

        const getListenersList = (data) => {
            if (typeof (data) == "undefined" && data == null) {
                return null
            }
            return (
                __legacy__objectToArray(data).map(e => {
                    return (
                        <div key={e.key}>
                            <antd.Tag>{e.key} > <antd.Tag color={e.value ? "geekblue" : "orange"} >{e.value ? "Enabled" : "Disable"}</antd.Tag></antd.Tag>
                        </div>
                    )
                })
            )
        }

        const getNamespacesMonitor = (data) => {
            if (typeof (data) == "undefined" && data == null) {
                return null
            }
            return (
                __legacy__objectToArray(data).map(e => {
                    return (
                        <div key={e.key} style={{ display: "flex", flexDirection: "column", justifyContent: "center", margin: "0 10px", width: "100%", height: "100%" }}>
                            <h4>{e.value}</h4>
                            <antd.Button onClick={() => { this.handleDispatchNamespace(e.value) }} > connect </antd.Button>
                        </div>
                    )
                })
            )
        }

        return (
            <div>
                <ReduxDebugger />

                <antd.Card>
                    <h1><Icons.ClusterOutlined style={{ marginRight: "7px" }} /> Socket </h1>
                    <antd.Card>
                        <h3> Main Node </h3>
                        <antd.Card>
                            <antd.Tag>{this.props.socket.socket_address}</antd.Tag>
                            <antd.Tag> {this.props.socket.nodes[this.state.mainNode].ioConn.nsp} </antd.Tag>
                            <antd.Tag color={connectionState == "connected" ? "green" : "volcano"} > {connectionState} </antd.Tag>
                            <antd.Tag color={latency > 60 ? "red" : "green"} > ~{latency}ms </antd.Tag>
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Listener manager </h3>
                        <antd.Card>
                            {getListenersList(this.props.socket.nodes[this.state.mainNode].listeners)}
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Registered Namespaces </h3>
                        <antd.Card>
                            <div style={{ display: "flex", flexDirection: "row", backgroundColor: "#fefefe", overflow: "scroll", textAlign: "center" }}>
                                {getNamespacesMonitor(this.props.socket.nodes[this.state.mainNode].registeredNamespaces)}
                            </div>
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Misc </h3>
                        <antd.Card>

                        </antd.Card>
                    </antd.Card>
                </antd.Card>
            </div>
        )
    }
}

