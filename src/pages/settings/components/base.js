import React, { Component, Fragment } from 'react';
import { List, Icon, Switch, Button, notification } from 'antd';
import { AppSettings } from '../../../../globals/settings.js'
import { DevOptions, ControlBar } from 'ycore'
import * as ycore from "ycore"
import { CustomIcons } from 'components'

class Base extends Component { 
  constructor(props){
    super(props),
    this.state = {
      SettingRepo:  AppSettings,
      forSave: false
    }
  }
  
  componentDidMount(){
    if (!localStorage.getItem('app_settings')) {
      DevOptions.ShowFunctionsLogs? console.warn('The settings for this app in your Account isnt set yet, Using stock settings...') : null
    }
  }
  SettingRender = data =>{
    try{
    return(
      <div>
      <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={item => (
                 <List.Item actions={item.actions}  >
                   <List.Item.Meta title={item.title} description={item.description} />
                   <Switch checkedChildren={'Enabled'} unCheckedChildren={'Disabled'} checked={item.value} onChange={() => this.onChange(item)} />
                 </List.Item>
               )}
        />
      <Button onClick={() => ycore.RegSW()} > Upload Service Worker </Button>
      </div>
      )
    }
    catch (err){
      return console.log(err)
    }
  }
  handleControlBar(){
    const ListControls = [
      (<div>
          <Button type="done" icon='save' onClick={() => this.saveChanges()} >Save</Button>
      </div>
     )
    ]
    ControlBar.set(ListControls)
  }
 
  saveChanges(){
    localStorage.setItem('app_settings', JSON.stringify(this.state.SettingRepo))
    this.setState({ forSave: false })
    notification.success({
       message: 'Settings saved',
       description:'The configuration has been saved, it may for some configuration to make changes you need to reload the application',
    })
    setTimeout((ycore.RefreshONCE()), 1000)
    ControlBar.close()
  }
  onChange(item) {
    try {
      this.handleControlBar()
      const to = !item.value
      const updatedValue = [...this.state.SettingRepo]
      .map(ita => ita === item? Object.assign(ita, { "value": to }) : ita);
      this.setState({SettingRepo: updatedValue, forSave: true})
      DevOptions.ShowFunctionsLogs? console.log(`Changing ${item.SettingID} to value ${to}`) : null
    } catch (err) {
      console.log(err)
    }
  }

  render() {
    return (
      <Fragment>
         <div>
            <h1><CustomIcons.RobotOutlined /> Behaviors</h1>
             {this.SettingRender(this.state.SettingRepo)}
         </div>
      </Fragment>
    );
  }
}

export default Base;
