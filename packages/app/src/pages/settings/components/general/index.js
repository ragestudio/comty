import React from 'react'
import { List, Button, Switch, Checkbox, InputNumber, Input } from 'antd'
import * as Icons from 'components/Icons'

import { verbosity } from '@nodecorejs/utils'
import { settings, newSetting } from 'core/libs/settings'
import listSettings from 'schemas/settings_general.json'

const AntdComponents = { Button, Switch, Checkbox, InputNumber, Input }
export default class GeneralSettings extends React.Component {
  state = {
    list: listSettings,
  }

  renderSetting = (item) => {
    if (!item.type || !item.id) {
      verbosity.log("Invalid component >", item)
      return null
    }
    if (typeof(AntdComponents[item.type]) == "undefined") {
      verbosity.log(`Invalid component, '${item.type}' not exists >`, item)
      return null
    }

    let itemProps = {
      onChange: (e) => this.onChange(item, e),
      checked: settings.get(item.id)
    }

    switch (item.type) {
      case 'Switch': {
        itemProps = { ...itemProps } // checkedChildren: "Enabled", unCheckedChildren: "Disabled"
        break
      }
      default:
        break
    }

    return React.createElement(AntdComponents[item.type], itemProps)
  }

  onChange(item, event) {
    try {
      let to = event

      verbosity.colors({ log: { textColor: "blue" } }).log(`Updating setting (${item.id}) > ${to}`)
      settings.set(item.id, to)

      const updatedValues = this.state.list.map(element =>
        element.id === item.id ? Object.assign(element, { value: to }) : element
      )
      this.setState({ list: updatedValues })
    } catch (err) {
      console.log(err)
    }
  }

  renderIcon(icon, props) {
    if (!Icons[icon]) {
      verbosity.log(`${icon} not exist!`)
      return null
    }
    return React.createElement(Icons[icon], props ?? null) 
  }

  render() {
    return (
      <List
        itemLayout="horizontal"
        dataSource={this.state.list}
        renderItem={(item) => (
          <List.Item actions={item.actions} key={item.id}>
            <List.Item.Meta
              title={<>{this.renderIcon(item.icon)}{item.title}</>}
              description={item.description}
            />
            {this.renderSetting(item)}
          </List.Item>
        )}
      />
    )
  }
}