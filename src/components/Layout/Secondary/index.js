import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './index.less'
import classnames from 'classnames'

import { __priPost, __secComments, __priSearch, __trendings, __pro } from './renders.js'

export const SwapMode = {
  close: () => {
    SecondaryLayoutComponent.Swapper.close()
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
  }
}

export default class Secondary extends React.PureComponent {
  constructor(props) {
    super(props),
    window.SecondaryLayoutComponent = this,
    this.state = {
      loading: true,
      half: false,
      swap: false,
      mode: '',
      gen_data: '',
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
        unique: false,
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
        unique: false,
      })
    },
    half : () => {
      this.setState({
        swap: false,
        half: true,
        unique: false,
      })
    },
    unique: ()=>{
      this.setState({
        swap: false,
        half: false,
        unique: true,
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
      case 'fragment': {
        return this.renderFragment()
      }
      default:
        return this.renderMain()
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
    return <__priPost isMobile={this.props.isMobile} payload={post_data} />
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
  renderMain = payload => {
    try {
      const trending_data = JSON.parse(this.state.gen_data)['trending_hashtag']
      return(
        <div className={styles.secondary_main}>

          {ycore.IsThisUser.pro()? <__pro /> : <__pro /> } 
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
  componentDidMount(){
    ycore.comty_get.general_data((err,res)=> {
      if (err) return false
      const notification_data = JSON.parse(res)['notifications']
      this.setState({ loading: false, gen_data: res, notification_data: notification_data })

    })
  }

  render() {
    const { userData, isMobile } = this.props
    if (!this.state.loading) return (
      <>
      {isMobile? null : <div className={styles.__secondary_colider}></div>} 
      <div
        id="secondary_layout"
        className={classnames(styles.secondary_wrapper, {
          [styles.mobile]: isMobile,
          [styles.active]: this.state.swap,
          [styles.half]: this.state.half,
          [styles.unique]: this.state.unique,
        })}
      >
       {isMobile? null :
        <div className={styles.secondary_userholder}>
        <div className={styles.notif_box}>
          <h1>{this.state.notification_data.length}</h1>    
        </div>
        <img
          onClick={() => ycore.router.go(`@${userData.username}`)}
          src={userData.avatar}
        />
      </div>}

        <div
          className={styles.secondary_layout_bg}
        >
          
          <div className={styles.secondary_container_1}>
            {this.state.swap || this.state.half || this.state.unique ? (
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
              [styles.mobile]: isMobile,
              [styles.active]: this.state.swap,
            })}
          >
            {this.SwapBalanceContent('__sec')}
          </div>

        </div>
      </div>
      </>
    )
    return null

  }
}
