import React from 'react'
import verbosity from 'core/libs/verbosity'
import { connect } from 'umi'
import classnames from 'classnames'

import {
  Primary
} from './components'

@connect(({ app }) => ({ app }))
export default class Overlay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
    }
    this.setWrapperRef = this.setWrapperRef.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.keydownFilter = this.keydownFilter.bind(this)

    window.overlaySwap = this.swap
  }

  swap = {
    isOpen: () => {
      return this.props.app.overlayActive
    },
    close: () => {
      this.props.dispatch({
        type: 'app/updateState',
        payload: {
          overlayActive: false,
          overlayElement: null
        },
      });
    },
    open: (payload) => {
      if (!payload) return false;
      verbosity(['Dispatching fragment =>', payload])
      this.props.dispatch({
        type: 'app/updateState',
        payload: {
          overlayActive: true,
          overlayElement: payload
        }
      })
    }
  }

  keydownFilter(event) {
    if (event.keyCode === 27) {
      this.swap.close()
    }
  }

  handleClickOutside(event) {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.swap.close()
    }
  }

  componentDidUpdate() {
    if (this.props.app.overlayElement) {
      document.addEventListener('keydown', this.keydownFilter, false)
      document.addEventListener('mousedown', this.handleClickOutside);
    } else {
      document.removeEventListener('mousedown', this.handleClickOutside);
    }
  }

  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  render() {
    const { overlayElement, overlayActive } = this.props.app

    const isOnMode = (mode) => {
      if (!overlayActive || typeof (overlayElement.mode) == "undefined") {
        return false
      }
      return overlayElement.mode === mode ? true : false
    }

    const renderElement = () => {
      if (overlayElement && overlayActive) {
        const renderProps = { id: overlayElement.id, mode: overlayElement.mode, fragment: overlayElement.element }
        return <Primary {...renderProps} />
      }

      return null
    }

    return (
      <div
        id="overlay"
        ref={this.setWrapperRef}
        focus="no_loose"
        className={classnames(window.classToStyle("overlay_wrapper"), {
          ["full"]: isOnMode("full"),
          ["half"]: isOnMode("half"),
        })}
      >
        {renderElement()}
      </div>
    )
  }
}
