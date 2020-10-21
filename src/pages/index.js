import React from 'react'
import ReduxDebugger from 'debuggers/redux'
import { FloatComponent } from 'components'
import { connect } from 'umi'
@connect((store) => (store))
export default class Index extends React.Component {
    handleOpenFloat() {
        FloatComponent({ children: <ReduxDebugger {...this.props} />, title: "redux debugger" })
    }
    render() {
        const dispatch = this.props.dispatch

        return (
            <div>
                <button onClick={() => this.handleOpenFloat()}> open on float </button>
                <ReduxDebugger />
                <button onClick={() => dispatch({type: "socket/floodTest", ticks: 100 })}> start floodTest </button>
                <button onClick={() => dispatch({type: "socket/toogleListener", listener: "floodTest" })}> break floodTest </button>
                <button onClick={() => dispatch({type: "socket/break", listener: "floodTest" })}> fullbreak </button>

            </div>
        )
    }
}