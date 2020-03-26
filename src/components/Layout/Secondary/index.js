import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './index.less'
import classnames from 'classnames'

import { __priPost, __secComments, __priSearch } from './renders.js'

export const SwapMode = {
  close: () => {
    SecondaryLayoutComponent.closeSwap()
  },
  openPost: (a, b) => {
    SecondaryLayoutComponent.setState({
      mode: 'post',
      global_raw: a,
    })
    SecondaryLayoutComponent.Swapper.open()
  },
  openSearch: a => {
    SecondaryLayoutComponent.setState({
      halfSwap: true,
      loading: true,
      mode: 'search',
      pri_raw: a,
    })
    SecondaryLayoutComponent.Swapper.half()
  },
}

export default class Secondary extends React.PureComponent {
  constructor(props) {
    super(props), (window.SecondaryLayoutComponent = this)
    this.state = {
      half: false,
      swap: false,
      mode: '',
      global_raw: '',
      pri_raw: '',
      sec_raw: '',
    }
  }

  Swapper = {
    close: () => {
      this.setState({
        swap: false,
        half: false,
        pri_raw: null,
        sec_raw: null,
        global_raw: null,
        mode: null,
      })
    },
    open: () => {
      this.setState({
        swap: true,
        half: false,
      })
    },
    half : () => {
      this.setState({
        swap: false,
        half: true,
      })
    }
  }

  SwapBalanceContent(container) {
    switch (container) {
      case '__pri': {
        return this.__pri()
      }
      case '__sec': {
        return this.__sec()
      }
      default:
        return null
    }
  }

  __pri() {
    const dtraw = this.state.pri_raw
    switch (this.state.mode) {
      case 'post': {
        return this.renderPost(this.state.global_raw)
      }
      case 'search': {
        return this.renderSearch(dtraw)
      }
      default:
        return null
    }
  }
  __sec() {
    const dtraw = this.state.sec_raw
    switch (this.state.mode) {
      case 'post': {
        return this.renderComments(this.state.global_raw)
      }
      default:
        return null
    }
  }

  renderSearch = key => {
    const payload = { key: key }
    ycore.comty_search.keywords((err, res) => {
      if (err) {
        ycore.notify.error(err)
      }
      ycore.yconsole.log('Founded entries => ', JSON.parse(res))
      this.setState({ global_raw: res, loading: false })
    }, payload)
    return (
      <div className={styles.renderSearch_wrapper}>
        <h2><Icons.SearchOutlined /> Results of {key || '... nothing ?'}</h2>
        <__priSearch payload={this.state.global_raw} />
      </div>
    )
  }

  renderPost = payload => {
    const post_data = JSON.parse(payload)['post_data']
    return <__priPost payload={post_data} />
  }

  renderComments = payload => {
    try {
      const post_comments = JSON.parse(payload)['post_comments']
      const post_data = JSON.parse(payload)['post_data']
      return (
        <__secComments post_id={post_data.post_id} payload={post_comments} />
      )
    } catch (error) {
      return null
    }
  }

  render() {
    const { userData } = this.props
    return (
      <>
      <div className={styles.__secondary_colider}></div>
      <div
        className={classnames(styles.secondary_wrapper, {
          [styles.active]: this.state.swap,
          [styles.half]: this.state.half,
        })}
      >
        <div className={styles.secondary_userholder}>
          <div className={styles.notif_box}></div>
          <img
            onClick={() => ycore.router.go(`@${userData.username}`)}
            src={userData.avatar}
          />
        </div>

        <div
          className={styles.secondary_layout_bg}
        >
          
          <div className={styles.secondary_container_1}>
            {this.state.swap || this.state.half ? (
              <antd.Button
                type="ghost"
                icon={<Icons.LeftOutlined />}
                onClick={() => this.Swapper.close()}
              >
                Back
              </antd.Button>
            ) : null}
            {this.SwapBalanceContent('__pri')}
          </div>
        

          <div
            className={classnames(styles.secondary_container_2, {
              [styles.active]: this.state.swap,
            })}
          >
            {this.SwapBalanceContent('__sec')}
          </div>

        </div>
      </div>
      </>
    )
  }
}
