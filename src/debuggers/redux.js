import React from 'react';
import { connect } from 'umi';
import * as antd from 'antd'
import { Database, Redux, AlertTriangle } from 'components/Icons'
import { ParamsList } from 'components'
import { __legacy__objectToArray } from 'core'
import store from 'store'

const storeKey = "dbg_redux_selecteKeys"
class ReduxDebugger extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            selectedKeys: this.storagedKeys.get() ?? []
        }
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
    
    storagedKeys = {
        get: () => {
            try {
                const storaged = store.get(storeKey)
                if (typeof(storaged) == "object" && storaged !== null) {
                    let mix = []
                    storaged.forEach(e => {
                        mix[e.key] = e.value
                    })
                    return mix
                }
                return []
            } catch (error) {
                console.log(error)
            }
        },
        set: (data) => {
            store.set(storeKey, __legacy__objectToArray(data))
        }
    }

    renderCheckboxes() {
        const keys = Object.keys(this.props)
        const onChange = (event, key) => {
            let resultKeys = this.state.selectedKeys
            resultKeys[key] = event.target.checked

    
            this.storagedKeys.set(resultKeys)
            this.setState({ selectedKeys: resultKeys })
        }
        return keys.map((e) => {
            return (
                <antd.Checkbox defaultChecked={this.state.selectedKeys[e] ?? false} key={e} onChange={(event) => onChange(event, e)}>{e}</antd.Checkbox>
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
                                <Database />
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
                    <h1 style={{ fontSize: '24px' }}><Redux /> Redux Store <span style={{ fontSize: '14px', float: "right" }}><AlertTriangle />Dangerously experimental debugger</span></h1>
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