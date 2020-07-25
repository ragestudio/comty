import React, { Component, Fragment } from 'react'
import { List, Switch, Button, notification, InputNumber } from 'antd'
import ListSettings from 'globals/settings'
import ControlBar from 'components/layout/ControlBar'

import verbosity from 'core/libs/verbosity'
import * as Icons from 'components/Icons'

class Base extends Component {
  constructor(props) {
    super(props),
      (this.state = {
        SettingRepo: ListSettings,
        forSave: false,
      })
  }

  rendersets = item => {
    let e = item.type
    switch (e) {
      case 'switch':
        return (
          <Switch
            checkedChildren={'Enabled'}
            unCheckedChildren={'Disabled'}
            checked={item.value ? true : false}
            onChange={() => this.onChangeSwitch(item)}
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

  SettingRender = data => {
    try {
      return (
        <div>
          <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={item => (
              <List.Item actions={item.actions} key={item.SettingID}>
                <List.Item.Meta
                  title={item.title}
                  description={item.description}
                />
                {this.rendersets(item)}
              </List.Item>
            )}
          />
        </div>
      )
    } catch (err) {
      return verbosity.log(err)
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
    ControlBar.set(ListControls)
  }

  saveChanges() {
    localStorage.setItem('app_settings', JSON.stringify(this.state.SettingRepo))
    this.setState({ forSave: false })
    notification.success({
      message: 'Settings saved',
      description:
        'The configuration has been saved, it may for some configuration to make changes you need to reload the application',
    })
    setTimeout(app._app.refresh(), 1000)
    ControlBar.close()
  }

  onChangeSwitch(item) {
    try {
      this.handleControlBar()
      const to = !item.value
      const updatedValue = [...this.state.SettingRepo].map(ita =>
        ita === item ? Object.assign(ita, { value: to }) : ita
      )
      this.setState({ SettingRepo: updatedValue, forSave: true })
      verbosity.log(`Changing ${item.SettingID} to value ${to}`)
    } catch (err) {
      console.log(err)
    }
  }
  onChangeNumeric(value, item) {
    this.HandleChangeNumeric(value)
  }
  HandleChangeNumeric(item, value) {
    try {
      this.handleControlBar()
      console.log(item.SettingID, value)
      const updatedValue = [...this.state.SettingRepo].map(ita =>
        ita === item ? Object.assign(ita, { value: value }) : ita
      )
      this.setState({ SettingRepo: updatedValue, forSave: true })
      verbosity.log(`Changing ${item.SettingID} to value ${to}`)
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
          {this.SettingRender(this.state.SettingRepo)}
        </div>
      </Fragment>
    )
  }
}

export default Base
