import React from 'react'
import ReduxDebugger from 'debuggers/redux'
import * as antd from 'antd'
import { connect } from 'umi'
import { ClusterOutlined } from 'components/Icons'
import { objectToArrayMap } from 'core'

@connect((store) => (store))
export default class Index extends React.Component {
    handleDispatchNamespace(key) {
        console.log(`Dispatching socket namespace (${key})`)
        this.props.dispatch({
            type: "socket/namespaceConnector",
            node: this.props.socket.headerNode,
            namespace: key
        })
    }

    render() {
        const dispatch = this.props.dispatch
        const headerNode = this.props.socket.nodes[this.props.socket.headerNode] ?? null

        const getListenersList = (data) => {
            if (typeof (data) == "undefined" && data == null) {
                return null
            }
            return (
                objectToArrayMap(data).map(e => {
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
                objectToArrayMap(data).map(e => {
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
                    <h1><ClusterOutlined style={{ marginRight: "7px" }} /> Socket </h1>
                    <antd.Card>
                        <h3> Header Node </h3>
                        <antd.Card>
                            <antd.Tag>{this.props.socket.socket_address}</antd.Tag>
                            <antd.Tag> {headerNode.ioConn.nsp ?? ""} </antd.Tag>
                            <antd.Tag color={headerNode.connectionState ?? "failed" === "connected" ? "green" : "volcano"} > {headerNode.connectionState ?? "destroyed"} </antd.Tag>
                            <antd.Tag color={(headerNode.latency ?? 0) > 60 ? "red" : "green"} > ~{headerNode.latency ?? "not exist"}ms </antd.Tag>
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Listener manager </h3>
                        <antd.Card>
                            {getListenersList(headerNode.listeners ?? null)}
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Registered Namespaces </h3>
                        <antd.Card>
                            <div style={{ display: "flex", flexDirection: "row", backgroundColor: "#fefefe", overflow: "scroll", textAlign: "center" }}>
                                {getNamespacesMonitor(headerNode.registeredNamespaces ?? null)}
                            </div>
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Misc </h3>
                        <antd.Card>
                            <antd.Button onClick={() => { dispatch({ type: "socket/resetHeader" }) }} > Reset HeaderSocket </antd.Button>
                            <antd.Button onClick={() => { dispatch({ type: "app/refreshToken" }) }} > force refreshToken </antd.Button>
                        </antd.Card>
                    </antd.Card>
                </antd.Card>
            </div>
        )
    }
}

