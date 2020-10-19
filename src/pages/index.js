import React from 'react'
import ReduxDebugger from 'debuggers/redux'
import { FloatComponent } from 'components'
export default class Index extends React.Component {
    handleOpenFloat() {
        FloatComponent({ children: <ReduxDebugger {...this.props} />, title: "redux debugger" })
    }
    render() {
        return (
            <div>
                <button onClick={() => this.handleOpenFloat()}> open on float </button>
                <ReduxDebugger />
            </div>
        )
    }
}