import React from 'react';
import { connect } from 'umi';
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import { ParamsList } from 'components'
import { __legacy__objectToArray } from 'core'
import store from 'store'

const storeKey = "dbg_redux_selecteKeys"
class ReduxDebugger extends React.Component {
    state = {
        selectedKeys: store.get(storeKey) ?? []
    }
    renderAllStore() {
        return __legacy__objectToArray(this.props).map(element => {
            return (
                <antd.Collapse.Panel key={element.key} style={{ wordBreak: 'break-all' }} header={`${element.key}`}>
                    {ParamsList(element.value)}
                </antd.Collapse.Panel>
            )
        })
    }
    renderCheckboxes() {
        const keys = Object.keys(this.props)
        const onChange = (event, key) => {
            let resultKeys = this.state.selectedKeys
            resultKeys[key] = event.target.checked

            store.set(storeKey, resultKeys)
            this.setState({ selectedKeys: resultKeys })
        }

        return keys.map((e) => {
            return (
                <antd.Checkbox key={e} onChange={(event) => onChange(event, e)}>{e}</antd.Checkbox>
            )
        })
    }

    render() {
        const returnSelectedKeys = () => {
            // const getStores = () => {
            //     let stores = []
            //     __legacy__objectToArray(this.state.selectedKeys).forEach((e) => {
            //         if (this.props[e.key] && e.value) {
            //             stores[e.key] = this.props[e.key]
            //         }
            //     })
            // }
            return __legacy__objectToArray(this.props).map(e => {
                if (!this.state.selectedKeys[e.key]) {
                    return null
                }
                return (
                    <antd.Collapse.Panel
                        key={e.key}
                        style={{ wordBreak: 'break-all' }}
                        header={
                            <div style={{ display: "flex", alignItems: "center", marginLeft: '10px' }} >
                                <Icons.Database />
                                <strong>{e.key}</strong>
                            </div>
                        }>
                        {ParamsList(e.value)}
                    </antd.Collapse.Panel>
                )
            })
        }
        return (
            <div style={{ background: "#fff", borderRadius: "8px", padding: "25px 15px" }}>
                <div style={{ marginBottom: "35px" }}>
                    <h1 style={{ fontSize: '24px' }}><Icons.Redux /> Redux Store <span style={{ fontSize: '14px', float: "right" }}><Icons.AlertTriangle />Dangerously experimental debugger</span></h1>
                    <antd.Card>{this.renderCheckboxes()}</antd.Card>
                </div>
                <hr />
                <antd.Collapse style={{ border: 0 }}>
                    {returnSelectedKeys()}
                </antd.Collapse>
            </div>
        )
    }
}

export default connect((store) => (store))(ReduxDebugger)