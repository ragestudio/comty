import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './index.less'
import classnames from 'classnames'

import {
  __priPost,
  __secComments,
  __priSearch,
  __trendings,
  __pro,
} from './renders.js'

export const SwapMode = {
  close: () => {
    SecondaryLayoutComponent.Swapper.close()
  },
  openPost: (id, content) => {
    if (!id) return false
    let d

    if (content) {
      d = content
    } else {
      const payload = { post_id: id }
      ycore.comty_post.get((err, res) => {
        if (err) {
          return false
        }
        const post_data = JSON.parse(res)['post_data']
        d = post_data
      }, payload)
    }

    console.log(d)

    if (d) {
      try {
        const pdata = (
          <__priPost
            isMobile={SecondaryLayoutComponent.props.isMobile}
            payload={d}
          />
        )
        SecondaryLayoutComponent.setState({ rd__pri: pdata, __pri_full: true })

        return true
      } catch (error) {
        console.log(error)
        return null
      }
    }
    return false
  },
  openComments: (id, content) => {
    if (!id) return false
    let d

    if (content) {
      d = content
    } else {
      console.debug('Missing Payload [content]!')
      localStorage.setItem('p_back_uid', postID)
      const payload = { post_id: id }
      ycore.comty_post.get((err, res) => {
        if (err) {
          return false
        }
        const post_comments = JSON.parse(res)['get_post_comments']
        d = post_comments
      }, payload)
    }
    if (d) {
      try {
        const pdata = <__secComments post_id={id} payload={d} />
        SecondaryLayoutComponent.setState({
          rd__sec: pdata,
          __sec_active: true,
        })
        return true
      } catch (error) {
        console.log(error)
        return null
      }
    }
  },
  openSearch: a => {
    SecondaryLayoutComponent.setState({
      mode: 'search',
      pri_raw: a,
    })
    SecondaryLayoutComponent.Swapper.half()
  },
  openFragment: fragment => {
    SecondaryLayoutComponent.setState({
      mode: 'fragment',
      global_raw: fragment,
    })
    SecondaryLayoutComponent.Swapper.unique()
  },
}

export default class Secondary extends React.PureComponent {
  constructor(props) {
    super(props),
      (window.SecondaryLayoutComponent = this),
      (this.state = {
        loading: true,
        gen_data: null,
        // Lays
        rd__pri: null,
        rd__sec: null,
        __pri_full: false,
        __pri_half: false,
        __sec_active: false,
        __sec_full: false,
      })
  }

  Swapper = {
    close: () => {
      this.setState({
        rd__pri: null,
        rd__sec: null,
        __pri_full: false,
        __pri_half: false,
        __sec_active: false,
        __sec_full: false,
      })
    },
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
        <h2>
          <Icons.SearchOutlined /> Results of {key || '... nothing ?'}
        </h2>
        <__priSearch payload={this.state.global_raw} />
      </div>
    )
  }

  renderMain = payload => {
    try {
      const trending_data = JSON.parse(this.state.gen_data)['trending_hashtag']
      return (
        <div className={styles.secondary_main}>
          {ycore.IsThisUser.pro() ? <__pro /> : <__pro />}
          <__trendings data={trending_data} />
        </div>
      )
    } catch (error) {
      return null
    }
  }
  renderFragment = () => {
    try {
      const fragment = this.state.global_raw
      return <React.Fragment>{fragment}</React.Fragment>
    } catch (error) {
      return null
    }
  }

  isOpen() {
    if (
      this.state.__pri_full ||
      this.state.__pri_half ||
      this.state.__sec_active ||
      this.state.__sec_full
    )
      return true
    return false
  }

  componentDidUpdate() {
    if (this.isOpen()) {
      document.addEventListener('keydown', this.escFunction, false)
    } else {
      document.removeEventListener('keydown', this.escFunction, false)
    }
  }

  componentDidMount() {
    ycore.comty_get.general_data((err, res) => {
      if (err) return false
      const notification_data = JSON.parse(res)['notifications']
      this.setState({
        loading: false,
        gen_data: res,
        notification_data: notification_data,
      })
    })
  }

  escFunction(event) {
    if (event.keyCode === 27) {
      SwapMode.close()
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.escFunction, false)
  }

  renderTarget(target) {
    try {
      switch (target) {
        case '__pri': {
          const fragment = this.state.rd__pri
          return <React.Fragment>{fragment}</React.Fragment>
        }
        case '__sec': {
          const fragment = this.state.rd__sec
          return <React.Fragment>{fragment}</React.Fragment>
        }
        default:
          return <h3>Invalid Render Target</h3>
      }
    } catch (error) {
      console.log(error)
      return null
    }
  }

  render() {
    const { userData, isMobile } = this.props
    if (!this.state.loading)
      return (
        <>
          {isMobile ? null : <div className={styles.__secondary_colider}></div>}
          <div
            id="secondary_layout__wrapper"
            className={classnames(styles.secondary_wrapper, {
              [styles.mobile]: isMobile,
            })}
          >
            {isMobile ? null : (
              <div className={styles.secondary_userholder}>
                <div className={styles.notif_box}>
                  <h1>{this.state.notification_data.length}</h1>
                </div>
                <img
                  onClick={() => ycore.router.go(`@${userData.username}`)}
                  src={userData.avatar}
                />
              </div>
            )}

            {this.isOpen() ? (
              <antd.Button
                type="ghost"
                icon={<Icons.LeftOutlined />}
                onClick={() => this.Swapper.close()}
              >
                Back
              </antd.Button>
            ) : null}

      <div className={styles.secondary_layout_bg}>
            <div
              id="secondary_layout_pri"
              className={classnames(styles.secondary_container_1, {
                [styles.full_open]: this.state.__pri_full,
                [styles.half]: this.state.__pri_half,
              })}
            >
              {this.renderTarget('__pri')}
            </div>

            <div
              id="secondary_layout__sec"
              className={classnames(styles.secondary_container_2, {
                [styles.mobile]: isMobile,
                [styles.active]: this.state.__sec_active,
                [styles.full_open]: this.state.__sec_full,
              })}
            >
              {this.renderTarget('__sec')}
            </div>
        </div>

          </div>
        </>
      )
    return null
  }
}
