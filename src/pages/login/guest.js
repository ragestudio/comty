import React from 'react'

import * as antd from 'antd'

import verbosity from 'core/libs/verbosity'

import * as Icons from 'components/Icons'
import { connect } from 'umi'

@connect(({ app }) => ({ app }))
export default class GuestSession extends React.PureComponent {
  state = {
    accept: false,
  }
  
  render() {
    return (
      <div style={{}}>
         <div>
             
             <h6><antd.Checkbox onChange={(e) => this.setState({accept: e.target.checked})} /> You have read and accept the TOS</h6>
             <antd.Button disabled={!this.state.accept} onClick={() => { this.props.dispatch({ type: "guestLogin" }) }} > Continue </antd.Button>
         </div>
      </div>
    )
  }
}
