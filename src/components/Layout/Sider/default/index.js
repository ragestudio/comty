import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from './index.less'

export default class Sider_Default extends React.PureComponent {
  state = {
    loading: true,
    menus: null
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
        ? (<antd.Menu.Item key={e.id}>
        {e.icon} <span>{e.title}</span>
        </antd.Menu.Item>)
        : null
    })
  }

  render() {
    const { handleClickMenu, logo } = this.props
    return this.state.loading? null : (
      <div className={styles.left_sider_wrapper}>
        <antd.Layout.Sider
          trigger={null}
          className={styles.left_sider_container}
          style={{ flex:'unset', maxWidth: 'unset', minWidth: '200px', width: '100%'}}
        >
          <div className={styles.left_sider_brandholder}>
            <img
              onClick={() => handleClickMenu({key: ''})}
              src={logo}
            />
          </div>
         
          <div className={styles.left_sider_menuContainer}>
              <antd.Menu
                selectable={true}
                className={styles.left_sider_menuItems}
                mode="vertical"
                onClick={handleClickMenu}
              >
                {this.renderMenus(this.state.menus, "top")}
              </antd.Menu>

              <div className={styles.something_thats_pulling_me_down}>
                <antd.Menu
                  selectable={false}
                  className={styles.left_sider_menuItems}
                  mode="vertical"
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
