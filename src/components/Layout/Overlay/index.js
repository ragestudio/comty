import React from 'react'
import verbosity from 'core/libs/verbosity'
import { connect } from 'umi'
import classnames from 'classnames'
import styles from './index.less'
import ErrorHandler from 'core/libs/errorhandler'
import * as antd from 'antd'
import { router } from 'core/libs'
import {
  Primary,
  Secondary,
  Card_Component,
  __searchBar
} from './components'


export let Swapper = {
  isOpen: (...props) => {
    window.OverlayComponent.swap.isOpen(...props)
  },
  closeAll: (...props) => {
    window.OverlayComponent.swap.closeAll(...props)
  },
  openFragment: (...props) => {
    window.OverlayComponent.swap.openFragment(...props)
  }
}

@connect(({ app }) => ({ app }))
export default class Overlay extends React.PureComponent {
  constructor(props) {
      super(props);
      this.state = {
        loading: true,
      };
      this.setWrapperRef = this.setWrapperRef.bind(this);
      this.handleClickOutside = this.handleClickOutside.bind(this);
      this.keydownFilter = this.keydownFilter.bind(this);
      window.OverlayComponent = this;
  
  }

  swap = {
    isOpen: () => {
      return this.props.app.overlayActive
    },
    closeAll: () => {
      this.props.dispatch({
        type: 'app/updateState',
        payload: {
          overlayActive: false,
          overlayElement: null
        },
      });
    },
    openFragment: (payload) => {
      if (!payload) return false;
      verbosity(['Dispatching fragment =>', payload])
      this.props.dispatch({
        type: 'app/updateState',
        payload: {
          overlayActive: true,
          overlayElement: payload
        },
      });
    }
  }

  keydownFilter(event) {
    if (event.keyCode === 27) {
      this.swap.closeAll()
    }
  }

  handleClickOutside(event) {
    if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
      this.swap.closeAll()
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
   /**
   * Set the wrapper ref
   */
  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  
  render() {
    const { overlayElement, overlayActive, session_data, session_valid, session_uuid } = this.props.app
    const mainElement = (
      <div>
        <div><__searchBar /></div>
        <div className={styles.mainElement}>
          {session_valid? <Card_Component onClick={() => router.goProfile(session_data["username"])} style={{ display: 'flex', lineHeight: '30px', wordBreak: 'break-all' }} ><antd.Avatar src={session_data.avatar} shape="square" /> <div style={{ marginLeft: '10px' }}> @{session_data.username}<span style={{ fontSize: "11px" }}>#{session_uuid}</span></div></Card_Component> : null }
        </div>
      </div>
    )
    const renderElement = () => {

      if (overlayElement && overlayActive) {
        const renderProps = {id: overlayElement.id, mode: overlayElement.mode, fragment: overlayElement.element}
        switch (overlayElement.position) {
          case 'primary':{
            return <Primary {...renderProps} />
          }
          case 'secondary':{
            return <Secondary {...renderProps} />
          }
          default:{
            return ErrorHandler({ code: 210 })
          }
        }
      }

      return(
        <Primary id="main" fragment={mainElement}  />
      )

    }
    

    return (
      <>
        <div
          id="Overlay_layout"
          ref={this.setWrapperRef}
          className={classnames(styles.Overlay_wrapper)}
        >
            {renderElement()}
        </div>
      </>
    )
  }
}
