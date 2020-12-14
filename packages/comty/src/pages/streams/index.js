import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import { connect } from 'umi'
import verbosity from 'core/libs/verbosity'

import { goLive } from 'core/models/helpers'

@connect(({ app }) => ({ app }))
export default class Streams extends React.Component {

    state = {
        list: []
    }

    componentDidMount() {
        try {

        } catch (error) {
            verbosity([error])
        }
    }

    availableList = () => {
        if (!Array.isArray(this.state.list)) {
            return false
        }
        if (this.state.list.length == 0) {
            return false
        }
        return true
    }

    render() {

        if (!this.availableList()) {
            return <div style={{ display: "flex", textAlign: "center", justifyContent: "center" }}>
                <antd.Result status="404" title="Its seems like nothing is on streaming" >
                    <antd.Button onClick={() => {goLive()}} type="primary" >
                        <Icons.Cast /> Start Streaming
                    </antd.Button>
                </antd.Result>
            </div>
        }

        return (
            <div>

            </div>
        )
    }
}