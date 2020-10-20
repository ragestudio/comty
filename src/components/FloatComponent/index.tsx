import verbosity from 'core/libs/verbosity'
import * as Icons from 'components/Icons'
import ReactDOM from 'react-dom'
import * as antd from 'antd'
import React from 'react'
import { Rnd } from 'react-rnd'
import { getDvaApp } from 'umi'
import { Provider } from 'react-redux'
const { resolve, join } = require('path')

const renderDiv = document.createElement('div')
class FloatComponent extends React.Component {
    handleClose() {
        Destroy()
    }

    render() {
        const renderProps = this.props.renderBox ?? { }
        const defaultBoxWidth = renderProps.width ?? 500
        const defaultBoxHeight = renderProps.height ?? 600
        return (
            <Rnd
                default={{
                    x: ((window.innerWidth / 2) - defaultBoxWidth / 2 ),
                    y: ((window.innerHeight / 2) - defaultBoxHeight / 2 ),
                    width: defaultBoxWidth,
                    height: defaultBoxHeight,
                }}
                maxHeight="60vh"
                style={{ overflowY: "scroll", overflowX: "hidden", zIndex: 1000 }}
                {...this.props.renderBox}
            >
                <div style={{ top: 0, position: "sticky", borderRadius: "8px 8px 0 0", background: "rgba(0, 0, 0, 0.4)", width: "100%", height: "35px", display: "flex", alignItems: "center", color: "#fff" }}>
                    <div style={{ fontSize: "15px", color: "#fff", display: "flex", height: "100%", padding: "0 10px", alignItems: "center", marginRight: "5px" }}>
                        <Icons.XCircle onClick={this.handleClose} style={{ cursor: "pointer" }} />
                    </div>
                    <div style={{ fontSize: "12px" }}>
                        {this.props.title ?? null}
                    </div>
                </div>
                {this.props.children}
            </Rnd>

        )
    }
}

export function Destroy() {
    verbosity('destroying')
    const unmountResult = ReactDOM.unmountComponentAtNode(renderDiv)
    if (unmountResult && renderDiv.parentNode) {
        renderDiv.parentNode.removeChild(renderDiv)
    }
}


export function Open(props) {
    const dvaApp = getDvaApp()
    const divId = props.id ?? "floatComponent"
    const MountParent = document.getElementById("root")
    const thisChild = document.getElementById(divId)
  
    verbosity([props])

    if (thisChild) {
        MountParent.removeChild(thisChild)
    }
    
    let RenderComponent = <FloatComponent {...props} />
    MountParent.appendChild(renderDiv).setAttribute('id', divId)
    ReactDOM.render(<Provider store={dvaApp._store}>{RenderComponent}</Provider>, renderDiv)
}

export default Open