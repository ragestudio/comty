import React from 'react'
import { Card } from 'antd'

import './index.less'

export default (props) => {
    const { children } = props

    return <Card style={props.style} className="actionsBar_card">
        <div style={props.wrapperStyle} className="actionsBar_flexWrapper">
            {children}
        </div>
    </Card>
}