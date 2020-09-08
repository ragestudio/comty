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

export const ControlController = {
  set: (e) => {
    if (!window.ControlComponent.state.active) {
      window.ControlComponent.setState({ fadein: true })
    }
    window.ControlComponent.setState({ active: true, render: e })
  },
  close: () => {
    window.ControlComponent.setState({ fadein: false })
    setTimeout(() => window.ControlComponent.setState({ active: false, render: null }), 1000)
  }
}

export default class Control extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      fadein: true,
    };
    window.ControlComponent = this;
  }


  render() {
    const { render, active, fadein } = this.state
    const isMobile = this.props.mobile? this.props.mobile : false
    return active ? (
      <StyleRoot>
        <div
          style={
            fadein ? animationStyles.fadeInUp : animationStyles.bounceOutDown
          }
        >
          <antd.Card bordered={false} className={classnames(styles.ControlCard, {[styles.mobile]: isMobile})} >
            <React.Fragment>{render}</React.Fragment>
          </antd.Card>
        </div>
      </StyleRoot>
    ) : null
  }
}
