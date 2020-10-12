import ContextMenu from 'components/Layout/ContextMenu'
import { connect } from 'umi'
import * as antd from 'antd'
import React from 'react'

@connect(({ app }) => ({ app }))
export default class ContextMenuDebug extends React.Component{
    
    openContext(){
        const list = [
            {
              key: "something",
              title: "test",
              params: {
                onClick: (e) => {
                    console.log("yepe", e)
                }
              }
            }
        ]
        ContextMenu({ xPos: 0, yPos: 0, renderList: list })
    }

    render(){
        return(
            <div>
                <antd.Button onClick={this.openContext}> openNew </antd.Button>
            </div>
        )
    }
}