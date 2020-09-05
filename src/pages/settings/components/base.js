import React, { Component, Fragment } from 'react'
import { List, Switch, Button, notification, InputNumber } from 'antd'
import ListSettings from 'globals/settings'
import { ControlController } from 'components/Layout/ControlBar'

import verbosity from 'core/libs/verbosity'
import * as Icons from 'components/Icons'
import { settings, newSetting } from 'core/libs/settings'

class Base extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: ListSettings,
    };
  }

  renderSetting = item => {
    switch (item.type) {
      case 'switch':
        return (
          <Switch
            checkedChildren={'Enabled'}
            unCheckedChildren={'Disabled'}
            checked={settings.get(item.id)}
            onChange={() => this.onChange(item)}
          />
        )
      case 'numeric':
        return (
          <InputNumber
            min={1}
            max={50}
            defaultValue={item.value}
            onChange={() => this.onChangeNumeric(item, value)}
          />
        )
      default:
        break
    }
  }

  handleControlBar() {
    const ListControls = [
      <div key={Math.random()}>
        <Button
          type="done"
          icon={<Icons.SaveOutlined />}
          onClick={() => this.saveChanges()}
        >
          Save
        </Button>
      </div>,
    ]
    ControlController.set(ListControls)
  }

  saveChanges() {
    localStorage.setItem('app_settings', JSON.stringify(this.state.SettingRepo))
    this.setState({ forSave: false })
    notification.success({
      message: 'Settings saved',
      description:
        'The configuration has been saved, it may for some configuration to make changes you need to reload the application',
    })
    ControlController.close()
  }

  onChange(item) {
    try {
      switch (item.type) {
        case 'switch': {
          item.to = !settings.get(item.id)
          verbosity.debug(`Changing setting (${item.id}: ${settings.get(item.id)}) => ${item.to}`)
          settings.set(item.id, item.to)
          this.handleChange(item)

        }
        case 'numeric': {

        }
        default: {
          return null
        }
      }
    } catch (err) {
      console.log(err)
    }
  }


  handleChange(item) {
    try {
      const updatedValue = this.state.list.map(element =>
        element.id === item.id ? Object.assign(element, { value: item.to }) : element
      )
      this.setState({ list: updatedValue})
    } catch (err) {
      console.log(err)
    }
  }
  

  render() {
    return (
      <Fragment>
        <div>
          <h1>
            <Icons.PullRequestOutlined /> Behaviors
          </h1>
          <List
            itemLayout="horizontal"
            dataSource={this.state.list}
            renderItem={item => (
              <List.Item actions={item.actions} key={item.id}>
                <List.Item.Meta
                  title={<>{item.icon}{item.title}</>}
                  description={item.description}
                />
                {this.renderSetting(item)}
              </List.Item>
            )}
          />
        </div>
      </Fragment>
    )
  }
}

export default Base
