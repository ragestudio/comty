import React from 'react'
import * as antd from 'antd'
import styles from './index.less'
import classnames from 'classnames'

import Radium, { StyleRoot } from 'radium'
import { fadeInUp, bounceOutDown } from 'react-animations'
const animationStyles = {
  fadeInUp: {
    animation: 'x 0.5s',
    animationName: Radium.keyframes(fadeInUp, 'fadeInUp'),
  },
  bounceOutDown: {
    animation: 'x 1s',
    animationName: Radium.keyframes(bounceOutDown, 'bounceOutDown'),
  },
}

export function SetControls(e) {
  window.ControlComponent.DummySetControls(e)
  return
}
export function CloseControls() {
  window.ControlComponent.DummyCloseControls()
  return
}

class Control extends React.PureComponent {
  constructor(props) {
    super(props)
    window.ControlComponent = this
    this.state = {
      Show: false,
      FadeIN: true,
    }
  }
  set = e => {
    if (this.state.Show == false) {
      this.setState({ FadeIN: true })
    }
    this.setState({ Show: true, RenderFragment: e })
  }
  close() {
    this.setState({ FadeIN: false })
    setTimeout(() => this.setState({ Show: false, RenderFragment: null }), 1000)
  }

  render() {
    const { RenderFragment, Show, FadeIN } = this.state
    const isMobile = this.props.mobile? this.props.mobile : false
    return Show ? (
      <StyleRoot>
        <div
          style={
            FadeIN ? animationStyles.fadeInUp : animationStyles.bounceOutDown
          }
        >
          <antd.Card bordered={false} className={classnames(styles.ControlCard, {[styles.mobile]: isMobile})} >
            <React.Fragment>{RenderFragment}</React.Fragment>
          </antd.Card>
        </div>
      </StyleRoot>
    ) : null
  }
}
export default Control
