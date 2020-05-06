import React from 'react'
import * as app from 'app'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './index.less'
import classnames from 'classnames'
import reactable from 'reactablejs'

import { 
  __sec,
  __pri,
  __trendings,
  __searchBar, 
  __suggestions,
  __priPost,
  __secComments,
  __priSearch,
} from './components'

export const SwapMode = {
  close: () => {
    OverlayLayoutComponent.Swapper.close()
  },
  openFragment: (fragment)=>{
    if (!fragment) return false
    return OverlayLayoutComponent.setState({ 
      rd__sec: fragment, 
      __sec_active: true,
    })
  },
  openPost: async (id, content) => {
    if (!id) return false
    let tmp;

    let promise = new Promise((res, rej) => {
      const payload = { post_id: id }
      app.comty_post.get((err, response) => {
        try {
          res(JSON.parse(response)['post_data'])
        } catch (error) {
          console.log(error)
        }
      }, payload)
    });

    if (!content){
      tmp = await promise
    }
    if (content){
      tmp = content
    }
  
    const pdata = <__priPost isMobile={OverlayLayoutComponent.props.isMobile} payload={tmp}/>
    
    return OverlayLayoutComponent.setState({ 
      rd__pri: pdata, 
      __pri_full: true 
    })

  },
  openComments: async (id, content) => {
    if (!id) return false
    let tmp;

    let promise = new Promise((res, rej) => {
      const payload = { post_id: id }
      app.comty_post.get((err, response) => {
       try {
          res(JSON.parse(response)['post_comments'])
       }catch (error) {
          console.log(error)
       }
      }, payload)
    });

    if (!content){
      tmp = await promise
    }
    if (content){
      tmp = content
    }
    
    const pdata = <__secComments post_id={id} payload={tmp} />
    return OverlayLayoutComponent.setState({
      rd__sec: pdata,
      __sec_active: true,
    })
    
  },
  openSearch: async (id, content) => {
    if (!id) return false
    let tmp;
    let promise = new Promise((res, rej) => {
      const payload = { key: id }
      app.comty_search.keywords((err, response) => {
        res(response)
      }, payload)
    });

    if (!content){
      tmp = await promise;
    }
    if (content){
      tmp = content;
    }
    
    const pdata = <div className={styles.renderSearch_wrapper}>
      <h2>
        <Icons.SearchOutlined /> Results of {id || '... nothing ?'}
      </h2>
      <__priSearch payload={tmp} />
    </div>

    return OverlayLayoutComponent.setState({
      rd__pri: pdata,
      __pri_half: true,
    })
    
  },

}

export default class Overlay extends React.PureComponent {
  constructor(props) {
    super(props),
      (window.OverlayLayoutComponent = this),
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

  handle_Exit(event) {
    if (event.keyCode === 27) {
      SwapMode.close()
    }
  }

  handle_genData() {
    app.comty_data.general_data((err, res) => {
      if (err) return false
      try {
        const notification_data = JSON.parse(res)['notifications']
        const trending_hashtag = JSON.parse(res)['trending_hashtag']
        this.setState({
          loading: false,
          gen_data: res,
          notification_data: notification_data,
          trending_hashtag: trending_hashtag,
        })
      } catch (error) {
        console.log(error)
        return null
      }
    })
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


  componentDidMount() {
    this.handle_genData()
    if(this.props.isMobile){
      window.addEventListener('popstate', function(event) {
        SwapMode.close()
      }, false);
    }
  }

  componentWillUnmount() {
    if(this.props.isMobile){
      document.removeEventListener('popstate', null)
    }
    document.removeEventListener('keydown', this.handle_Exit, false)
  }

  componentDidUpdate() {
    if (this.isOpen()) {
      document.addEventListener('keydown', this.handle_Exit, false)
    } else {
      document.removeEventListener('keydown', this.handle_Exit, false)
    }
  }

  renderTarget(target) {
    try {
      switch (target) {
        case '__pri': {
          const fragment = this.state.rd__pri
          if (!fragment && !this.props.isMobile) {
            return <React.Fragment>{this.__main()}</React.Fragment>
          }
          return <React.Fragment>{fragment}</React.Fragment>
        }
        case '__sec': {
          const fragment = this.state.rd__sec
          return <>
          {this.props.isMobile? <div className={styles.mobile_drag}><div className={styles.inner_drag}></div></div> : null}
          <React.Fragment>{fragment}</React.Fragment>
          </>
        }
        default:
          return <h3>Invalid Render Target</h3>
      }
    } catch (error) {
      console.log(error)
      return null
    }
  }
  renderExit(target){
    if (!target) return null
    const { rd__pri, rd__sec } = this.state
    const btn = <div className={styles.exit_button}><antd.Button type="ghost" icon={<Icons.LeftOutlined />} onClick={() => this.Swapper.close()}> Back </antd.Button></div>
    if (this.isOpen()) {
      switch (target) {
        case '__pri':{
          if (rd__pri&&rd__sec) {
            return btn
          }
          if (!rd__sec) {
            return btn
          }
          return null
        }
        case '__sec':{
          if (!rd__pri && this.props.isMobile) {
            return null
          }
          if (!rd__pri) {
            return btn
          }
          return null
        }
        default:
         return null
      }
    }
    return null
  }
  __main(){
    const fragment = this.state.rd__pr
    if (!fragment && !this.props.isMobile) {
      return (
        <React.Fragment>
     
            <div className={styles.Overlay_body_component}> <__searchBar /> </div>
            <div className={styles.Overlay_body_component}> <__trendings data={this.state.trending_hashtag} /> </div>
            <div className={styles.Overlay_body_component}> <__suggestions /> </div>
      
        </React.Fragment>
      )
    }
 

    
  }
  render() {
    const { userData, isMobile } = this.props
    const __sec_functs = (this.Swapper)
    if (!this.state.loading)
      return (
        <>
          {isMobile ? null : <div className={styles.__Overlay_colider}></div>}
          <div
            id="Overlay_layout__wrapper"
            className={classnames(styles.Overlay_wrapper, {
              [styles.mobile]: isMobile,
              [styles.active]: this.isOpen()
            })}
          >
        

            <__pri render={this.renderTarget('__pri')} isMobile={isMobile} functs={__sec_functs} type={this.state.__pri_full? "full_open" : this.state.__pri_half? "half" : null} />
            <__sec render={this.renderTarget('__sec')} isMobile={isMobile} functs={__sec_functs} type={this.state.__sec_full? "full_open" : this.state.__sec_active? "active" : null} />
            
      

          </div>
        </>
      )
    return null
  }
}
