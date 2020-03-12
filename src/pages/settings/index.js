import React from 'react';
import { GridContent } from '@ant-design/pro-layout';
import { Menu, Typography } from 'antd';
import * as antd from 'antd'
import * as ycore from 'ycore'
import * as Icons from '@ant-design/icons'
import styles from './style.less';

import NotificationView from './components/notification.js';
import SecurityView from './components/security.js';
import Base from './components/base.js'
import AppAbout from './components/about.js'
import Earnings from './components/earnings.js'

const { Item } = Menu;
const menuMap = {
  base: (<span><Icons.ControlOutlined /> General</span>),
  security: (<span><Icons.SafetyCertificateOutlined /> Security & Privacity</span>),
  notification: (<span><Icons.MailOutlined /> Notification</span>),
  earnings: (<span><Icons.DollarCircleOutlined /> Earnings</span>),
  about: (<span><Icons.ContainerOutlined /> About</span>)

};

class GeneralSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectKey: 'base',
    };
  }

  getMenu = () => {
    return Object.keys(menuMap).map(item => <Item key={item}>{menuMap[item]}</Item>);
  };

  selectKey = (key) => {
    this.setState({
      selectKey: key,
    });
  };

  renderChildren = () => {
    const { selectKey } = this.state;
    switch (selectKey) {
      case 'base':
        return <Base />;
      case 'security':
        return <SecurityView />;
      case 'notification':
        return <NotificationView />;
      case 'about':
        return <AppAbout />;
      case 'earnings':
        return <Earnings />
      default:
        break;
    }
    return null;
  };

  render() {
    const { selectKey } = this.state;
    return (
      <div className={styles.main}>
        <div className={styles.leftMenu}>
          <h2><Icons.SettingOutlined /> Settings </h2>
          <Menu
            mode="inline"
            selectedKeys={[selectKey]}
            onClick={({ key }) => this.selectKey(key)}
          >
            {this.getMenu()}
          </Menu>
        </div>
        <div className={styles.right}>
          {this.renderChildren()}
        </div>
      </div>
    );
  }
}

export default GeneralSettings
