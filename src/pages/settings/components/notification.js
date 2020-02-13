import * as antd from 'antd';
import React, { Component, Fragment } from 'react';

class NotificationView extends Component {
  getData = () => {
    const Action = (
      <antd.Switch
        checkedChildren={'open'}
        unCheckedChildren={'close'}
        defaultChecked
      />
    );
    return [
      {
        title: 'Title 1',
        description: 'Description 1',
        actions: [Action],
      },
      {
        title: 'Title 2',
        description: 'Description 2',
        actions: [Action],
      },
      {
        title: 'Title 3',
        description: 'Description 3',
        actions: [Action],
      },
    ];
  };

  render() {
    const data = this.getData();
    return (
      <Fragment>
        <antd.List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={item => (
            <antd.List.Item actions={item.actions}>
              <antd.List.Item.Meta title={item.title} description={item.description} />
            </antd.List.Item>
          )} />
      </Fragment>
    );
  }
}

export default NotificationView;
