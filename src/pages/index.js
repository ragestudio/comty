import React from 'react'
import ReduxDebugger from 'debuggers/redux'
import * as antd from 'antd'
import { FloatComponent } from 'components'
import { connect } from 'umi'
import * as Icons from 'components/Icons'
import { __legacy__objectToArray } from 'core'

@connect((store) => (store))
export default class Index extends React.Component {
    handleOpenFloat() {
        FloatComponent({ children: <ReduxDebugger {...this.props} />, title: "redux debugger" })
    }

    handleDispatchNamespace(key) {
        console.log(`Dispatching socket namespace (${key})`)
        this.props.dispatch({
            type: "socket/namespaceConnector",
            namespace: key
        })
    }

    render() {
        const dispatch = this.props.dispatch
        const { connectionState, socket_address, latency } = this.props.socket

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
                            <h4>{e.key}</h4>
                            <antd.Button onClick={() => { this.handleDispatchNamespace(e.key) }} > dispatch </antd.Button>  
                            <antd.Button onClick={() => { dispatch({ type: "socket/toogleListener", listener: e.key }) }} > break </antd.Button>  
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
                        <h3> State </h3>
                        <antd.Card>
                            <antd.Tag>{socket_address}</antd.Tag>
                            <antd.Tag color={connectionState == "connected" ? "green" : "volcano"} > {connectionState} </antd.Tag>
                            <antd.Tag color={latency > 60 ? "red" : "green"} > ~{latency}ms </antd.Tag>
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Listener manager </h3>
                        <antd.Card>
                            {getListenersList(this.props.socket.listeners)}
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Registered Namespaces </h3>
                        <antd.Card>
                            <div style={{ display: "flex", flexDirection: "row", backgroundColor: "#fefefe", overflow: "scroll", textAlign: "center" }}>
                                {getNamespacesMonitor(this.props.socket.registeredNamespaces)}

                            </div>
                        </antd.Card>
                    </antd.Card>
                    <antd.Card>
                        <h3> Misc </h3>
                        <antd.Card>
                            <antd.Button onClick={() => dispatch({ type: "socket/getLatency" })} > getLatency </antd.Button>
                            <antd.Button onClick={() => dispatch({ type: "socket/floodTest", ticks: 100 })} > start floodtest </antd.Button>
                            <antd.Button onClick={() => dispatch({ type: "socket/toogleListener", listener: "floodTest" })}> break floodTest </antd.Button>
                            <antd.Button onClick={() => dispatch({ type: "socket/break", listener: "floodTest" })}> fullbreak  </antd.Button>
                        </antd.Card>
                    </antd.Card>
                </antd.Card>
            </div>
        )
    }
}

