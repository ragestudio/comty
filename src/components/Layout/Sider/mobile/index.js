import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from './index.less'

export default class Sider_Mobile extends React.PureComponent {

  renderMenus(data){
    return data.map(e => {
      return <antd.Menu.Item key={e.id} style={{ color: '#ffffff', fontSize: '18px' }} >{e.icon}</antd.Menu.Item>
    })
  }
  
  render() {
    const { handleClickMenu,  menus } = this.props
    return (
      <div className={styles.left_sider_wrapper}>
        <antd.Layout.Sider
          trigger={null}
          width='100%'
        >
              <antd.Menu
                mode="horizontal"
                onClick={handleClickMenu}
              >
                {this.renderMenus(menus)}
              </antd.Menu>
        </antd.Layout.Sider>
      </div>
    )
  }
}
