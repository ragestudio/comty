import React from 'react'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import Icon from '@ant-design/icons'

import { withI18n, Trans } from '@lingui/react'
import styles from './mobile.less'
import * as app from 'app'
import CustomIcons from '../../CustomIcons'

@withI18n()
export default class Sider_Mobile extends React.PureComponent {
  render() {
    const { handleClickMenu, userData } = this.props
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
                <antd.Menu.Item key="explore">
                  <Icons.CompassTwoTone twoToneColor={"#28c35d"} />
                </antd.Menu.Item>

                <antd.Menu.Item key="saves">
                  <Icons.HeartTwoTone twoToneColor={"#ff4d4f"} />
                </antd.Menu.Item>

                <antd.Menu.Item key="general_settings">
                    <Icons.SettingOutlined />
                </antd.Menu.Item>

                <antd.Menu.Item key="profile">
                   <antd.Avatar size={20} shape="square" src={userData.avatar} />
                </antd.Menu.Item>


              </antd.Menu>




        </antd.Layout.Sider>
      </div>
    )
  }
}
