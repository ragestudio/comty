import React from 'react';
import { GridContent } from '@ant-design/pro-layout';
import { Menu, Typography, Icon } from 'antd';
import styles from './style.less';

import NotificationView from './components/notification.js';
import SecurityView from './components/security.js';
import Base from './components/base.js'

const { Item } = Menu;
const menuMap = {
  base: 'App',
  security: 'Security',
  notification: 'Notification',
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
      default:
        break;
    }
    return null;
  };

  render() {
    const { mode, selectKey } = this.state;
    return (
      <div>
        <Title className={styles.titleHead}><Icon type="setting" /> Settings</Title>
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
