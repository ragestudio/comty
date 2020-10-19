import verbosity from 'core/libs/verbosity'
import * as Icons from 'components/Icons'
import ReactDOM from 'react-dom'
import * as antd from 'antd'
import React from 'react'
import { Rnd } from 'react-rnd'

const renderDiv = document.createElement('div')
class FloatComponent extends React.Component {
    handleClose() {
        Destroy()
    }

    render() {
        return (
            <Rnd
                default={{
                    x: 500,
                    y: 0,
                    width: 320,
                    height: "fit-content"
                }}
                maxHeight="60vh"
                style={{ overflowY: "scroll", overflowX: "hidden", zIndex: 1000 }}
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
    const divId = props.id ?? "floatComponent"
    const mountParent = document.getElementById("appWrapper")
    const thisChild = document.getElementById(divId)

    verbosity([props])

    if (thisChild) {
        mountParent.removeChild(thisChild)
    }
    document.body.appendChild(renderDiv).setAttribute('id', divId)
    ReactDOM.render(<FloatComponent />, renderDiv)
}

export default Open