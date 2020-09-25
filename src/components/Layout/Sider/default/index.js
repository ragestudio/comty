import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from './index.less'
import classnames from 'classnames'
import { connect } from 'umi'

@connect(({ app }) => ({ app }))
export default class Sider_Default extends React.Component {
  state = {
    loading: true,
    menus: null
  }

  toogleCollapse(){
    window.toogleSidebarCollapse()
  }

  componentDidMount(){
    this.setState({ menus: this.props.menus, loading: false })
  }

  renderMenus(data, position){
    if(!position) return null
    return data.map(e => {
      if (!e.attributes) e.attributes = {}
      let componentPosition = e.attributes.position || "top" 
     
      return componentPosition == position
        ? (
          <antd.Menu.Item icon={e.icon} key={e.id}>
            <span>{e.title}</span>
          </antd.Menu.Item>
        )
        : null
    })
  }

  HeaderIconRender = () => {
    if(this.props.app.session_valid){
      return(
        <antd.Avatar shape="circle" size="large" src={this.props.app.session_data.avatar} />
      )
    }else{
      return(
        <img className={styles.logotype} src={this.props.logo} />
      )
    }
  }

  render() {
    const { handleClickMenu } = this.props
    if (this.state.loading) {
      return null
    }
    return (
      <div className={styles.left_sider_wrapper}>
        <antd.Layout.Sider
          collapsed={this.props.app.sidebar_collapsed || false}
          trigger={null}
          className={styles.left_sider_container}
          width="175px"
          style={{ flex:'unset' }}
        >
          <div onClick={() => {handleClickMenu({key: ''})}} className={classnames(styles.left_sider_header, {[styles.emb]: this.props.app.embedded})}>
            <img className={styles.logotype} src={this.props.logo} />
          </div>         
          <div className={styles.left_sider_menuContainer}>
              <antd.Menu
                selectable={false}
                className={styles.left_sider_menuItems}
                onClick={handleClickMenu}
              >
                {this.renderMenus(this.state.menus, "top")}
              </antd.Menu>

              <div className={styles.left_sider_footer}>
                <antd.Menu
                  selectable={false}
                  className={styles.left_sider_menuItems}
                  onClick={handleClickMenu}
                >
                  {this.renderMenus(this.state.menus, "bottom")}
                </antd.Menu>
              </div>
          </div>
        </antd.Layout.Sider>
      </div>
    )
  }
}
