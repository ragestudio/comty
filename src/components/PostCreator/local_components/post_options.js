import React from 'react'
import * as antd from 'antd'
import * as app from 'app'
import * as Icons from 'components/Icons'
import Icon from '@ant-design/icons'
import { Post_Options } from 'globals/post_options.js'
import styles from './post_options.less'

export const optionBox = {
  toogle: () => {
    window.postoptions_box_class.handleToggleToolbox()
    return true
  },
  get: () => {
    return window.postoptions_box_class.state.options_repo
  },
}

export default class Post_options extends React.Component {
  constructor(props) {
    super(props), 
    window.postoptions_box_class = this,
    this.state = {
      options_repo: Post_Options,
      options_box: false,
    }
  }

  onChangeOption(checked, id) {
    app.yconsole.log(`${id} to ${checked}`)
  }

  handleToggleToolbox = () => {
    this.setState({ options_box: !this.state.options_box })
  }

  onChangeSwitch(item) {
    try {
      const to = !item.value
      const updatedValue = [...this.state.options_repo].map(ita =>
        ita === item ? Object.assign(ita, { value: to }) : ita
      )
      this.setState({ options_repo: updatedValue, forSave: true })
      app.yconsole.log(`Changing ${item.key} to value ${to}`)
    } catch (err) {
      console.log(err)
    }
  }

  require(i) {
    if (i) {
      try {
        switch (i) {
          case 'pro':
            return app.IsThisUser.pro() ? false : true
          case 'dev':
            return app.IsThisUser.dev() ? false : true
          default:
            break
        }
      } catch (err) {
        app.notify.error(err)
        return false
      }
    }
    return false
  }

  rendersets = item => {
    let e = item.type
    switch (e) {
      case 'switch':
        return (
          <antd.Switch
            disabled={this.require(item.require)}
            checkedChildren={'Enabled'}
            unCheckedChildren={'Disabled'}
            checked={item.value}
            onChange={() => this.onChangeSwitch(item)}
          />
        )
      default:
        break
    }
  }

  renderSettings = () => {
    return (
      <antd.List
        itemLayout="horizontal"
        split="true"
        dataSource={this.state.options_repo}
        renderItem={item => (
          <antd.List.Item actions={item.actions} key={item.key}>
            <div className={styles.optionItemIcon}> {item.icon} </div>
            <antd.List.Item.Meta
              title={item.title}
              description={item.description}
            />
            {this.require(item.require)
              ? `You need ${item.require}`
              : this.rendersets(item)}
          </antd.List.Item>
        )}
      />
    )
  }
  render() {
    return (
      <div className={styles.optionsWrapper}>
        <antd.Drawer
          className={styles.optionsWrapper}
          placement="top"
          closable={true}
          onClose={this.handleToggleToolbox}
          visible={this.state.options_box}
        >
          <h1>
            <Icons.SendOutlined /> Post Options
          </h1>
          <br />
          <div className={styles.PostOptionsWrapper}>
            <div className={styles.optionItem}>
              <h3>Share Options</h3>
              {this.renderSettings()}
            </div>
            <div className={styles.optionItem}>
              <h3>Add some Extra</h3>
              <antd.Button
                icon={<Icons.ProfileOutlined />}
                disabled={true}
                type="primary"
              >
                {' '}
                Insert an Poll{' '}
              </antd.Button>
              <antd.Button
                icon={<Icons.ProfileOutlined />}
                disabled={true}
                type="primary"
              >
                {' '}
                Insert an Background{' '}
              </antd.Button>
            </div>
          </div>
        </antd.Drawer>
      </div>
    )
  }
}
