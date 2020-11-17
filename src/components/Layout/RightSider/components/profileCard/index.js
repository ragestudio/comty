import React from 'react'
import * as antd from 'antd'
import router from 'core/libs/router' 
import withConnector from 'core/libs/withConnector'
import { CardComponent } from 'components'

@withConnector
export default class ProfileCard extends React.Component {
    render() {
        const { session_data, session_valid, session_uuid } = this.props.app

        if (session_valid) {
            return(
                <div className={window.classToStyle("right_sidebar_component")}>
                <CardComponent onClick={() => router.goProfile(session_data["username"])} style={{ display: 'flex', lineHeight: '30px', wordBreak: 'break-all' }} >
                    <antd.Avatar src={session_data.avatar} shape="square" />
                    <div style={{ marginLeft: '10px' }}>
                        @{session_data.username}
                        <span style={{ fontSize: "11px" }}>#{session_uuid}</span>
                    </div>
                </CardComponent>
            </div>
            )
        }
        return null
    }
}