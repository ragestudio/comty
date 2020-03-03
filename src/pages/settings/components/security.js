import React, { Component, Fragment } from 'react';
import { List } from 'antd';

const passwordStrength = {
  strong: (
    <span className="strong">
      Strong
    </span>
  ),
  medium: (
    <span className="medium">
      Medium
    </span>
  ),
  weak: (
    <span className="weak">
      Weak
    </span>
  ),
};

class SecurityView extends Component {
  getData = () => [
    {
      title: <h1>Password</h1>,
      description: (
        <Fragment>
          <p>Something</p>
          {passwordStrength.strong}
        </Fragment>
      ),
      actions: [
        <a key="Modify">
          Modify
        </a>,
      ],
    },
    {
      title: <h1>Security question</h1>,
      description: 'Security cuesting seting',
      actions: [
        <a key="Set">
          Set
        </a>,
      ],
    },
    {
      title: 'Mail',
      description: 'YourEmail@jeje.com',
      actions: [
        <a key="Modify">
          Modify
        </a>,
      ],
    },
    {
      title: 'mfa',
      description: 'mfa settings',
      actions: [
        <a key="bind">
          Bind
        </a>,
      ],
    },
  ];

  render() {
    const data = this.getData();
    return (
      <Fragment>
        <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={item => (
            <List.Item actions={item.actions}>
              <List.Item.Meta title={item.title} description={item.description} />
            </List.Item>
          )}
        />
      </Fragment>
    );
  }
}

export default SecurityView;
