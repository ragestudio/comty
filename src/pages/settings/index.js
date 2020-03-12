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
  base: 'General',
  security: 'Security & Privacity',
  notification: 'Notification',
  earnings: 'Earnings',
  about: 'About'

};

const { Title } = Typography;
class GeneralSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'inline',
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
    const { mode, selectKey } = this.state;
    return (
      <div>
        <Title className={styles.titleHead}> {this.getMenu()} </Title>
        <GridContent>
          <div
            className={styles.main}
            ref={ref => {
              if (ref) {
                this.main = ref;
              }
            }}
          >
            <div className={styles.leftMenu}>
              <Menu
                mode={mode}
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
        </GridContent>
      </div>
    );
  }
}

export default GeneralSettings
