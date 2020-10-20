import React from 'react';
import { connect } from 'umi';
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import { ParamsList } from 'components'
import { __legacy__objectToArray } from 'core'

class ReduxDebugger extends React.Component {
    state = {
        selectedKeys: []
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

            this.setState({ selectedKeys: resultKeys })
            console.log(this.state.selectedKeys)
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
                    <antd.Collapse.Panel key={e.key} style={{ wordBreak: 'break-all' }} header={<><Icons.Redux style={{ height: '19px', marginRight: '7px' }} /> {e.key}</>}>
                        {ParamsList(e.value)}
                    </antd.Collapse.Panel>
                )
            })
        }
        return (
            <div style={{ background: "#fff", borderRadius: "8px", padding: "25px 15px" }}>
                <div style={{ marginBottom: "35px" }}>
                    <h1 style={{ fontSize: '24px' }}><Icons.Redux /> Redux Store</h1>
                    <span><Icons.AlertTriangle />Warning, the use of this debugger is not recommended due to its high resource usage</span>
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