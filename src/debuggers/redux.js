import React from 'react';
import { connect } from 'umi';
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import { __legacy__objectToArray } from 'core'

class ReduxDebugger extends React.Component {
    state = {
        app_state: null
    }

    render() {
        const modelToMap = (data) => {
            if (!data) return false
            return __legacy__objectToArray(data).map(e => {
                try {
                    const v = JSON.stringify(e.value)
                    if (!v) return false
                    return (
                        <div style={{ margin: '0 5px 15px 5px' }} key={e.key} >
                            <h4>{e.key}</h4>
                            {v.length < 500 ? <span>{v}</span> : <antd.Collapse ><antd.Collapse.Panel header={`Hidden text ( ${v.length} Characters )`}><span>{v}</span></antd.Collapse.Panel></antd.Collapse>}
                        </div>
                    )
                } catch (error) {
                    return null
                }
            })

        }

        return (
            <div>
                <antd.Collapse style={{ border: 0 }}>

                    <antd.Collapse.Panel style={{ wordBreak: 'break-all' }} header={<><Icons.Redux style={{ height: '19px', marginRight: '7px' }} /> socket</>}>
                        {modelToMap(this.props.app)}
                    </antd.Collapse.Panel>

                    <antd.Collapse.Panel style={{ wordBreak: 'break-all' }} header={<><Icons.Redux style={{ height: '19px', marginRight: '7px' }} /> contextmenu</>}>
                        {modelToMap(this.props.contextMenu)}
                    </antd.Collapse.Panel>

                    <antd.Collapse.Panel style={{ wordBreak: 'break-all' }} header={<><Icons.Redux style={{ height: '19px', marginRight: '7px' }} /> socket</>}>
                        {modelToMap(this.props.socket)}
                    </antd.Collapse.Panel>

                </antd.Collapse>
            </div>
        )
    }
}

export default connect((store) => (store))(ReduxDebugger)