import React from 'react'
import { verbosity } from '@nodecorejs/utils'
import { connect } from 'umi'
import classnames from 'classnames'

import { Primary } from './components'
import { objectToArrayMap } from '@nodecorejs/utils'

const includeAllowedProps = [ "size" ]

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
      verbosity.log('Dispatching fragment =>', payload)
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
      document.addEventListener('mousedown', this.handleClickOutside)
    } else {
      document.removeEventListener('mousedown', this.handleClickOutside)
    }
  }

  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  render() {
    let props = {}
    const { overlayElement, overlayActive } = this.props.app

    const isOnMode = (mode) => {
      if (!overlayActive || typeof (overlayElement.mode) == "undefined") {
        return false
      }
      return overlayElement.mode === mode ? true : false
    }

    const renderElement = () => {
      if (overlayElement && overlayActive) {
        return <Primary {...overlayElement} />
      }
      return null
    }

    try {
      objectToArrayMap(overlayElement).forEach((e) => {
        if (includeAllowedProps.includes(e.key)) {
          props[e.key] = e.value
        }
      })
    } catch (error) {
      // terrible (⓿_⓿)
    }
    
    return (
      <div
        style={props.size? { width: props.size } : null}
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
