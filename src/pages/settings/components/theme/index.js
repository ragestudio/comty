import React from 'react'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import { connect } from 'umi'
import { arrayToObject, __legacy__ObjectToArray } from 'core'
import ThemeSettingsList from 'globals/theme_settings.js'

import BackgroundSetting from './components/background'
import DarkmodeSetting from './components/darkmode'
import ColorSetting from './components/color'

const componentsMap = {
    backgroundImage: <BackgroundSetting />,
    darkmode: <DarkmodeSetting />,
    color: <ColorSetting />,
}

@connect(({ app }) => ({ app }))
export default class ThemeSettings extends React.Component {
    state = {
        selectedKey: null,
        keys: []
    }

    componentDidMount() {
        let mix = []
        ThemeSettingsList.forEach(e => {
            mix[e.id] = e
        })
        this.setState({ keys: mix })
    }
    
    render() {
        const selectedKeyItem = this.state.keys[this.state.selectedKey] ?? { icon: null, title: null }
        const handleClick = (key) => key ? this.setState({ selectedKey: key }) : null
        const isActive = (key) => { return key ? key.active : false }
        return (
            <div>
                <antd.List
                    itemLayout="horizontal"
                    dataSource={ThemeSettingsList}
                    renderItem={item => (
                        <div style={{ margin: '10px 0 10px 0' }} >
                            <antd.Card size="small" bodyStyle={{ width: '100%' }} style={{ display: "flex", flexDirection: "row", margin: 'auto', borderRadius: '12px' }} hoverable onClick={() => handleClick(item.id)}>
                                <h3>{item.icon}{item.title} <div style={{ float: "right" }}><antd.Tag color={isActive(arrayToObject(this.props.app.app_theme)[item.id]) ? "green" : "default"} > {isActive(arrayToObject(this.props.app.app_theme)[item.id]) ? "Enabled" : "Disabled"} </antd.Tag></div></h3>
                                <p>{item.description}</p>
                            </antd.Card>
                        </div>
                    )}
                />

                <antd.Drawer
                    placement="right"
                    width="50%"
                    closable
                    onClose={() => this.setState({ selectedKey: null })}
                    visible={this.state.selectedKey ? true : false}
                >
                    <React.Fragment>
                        <div>
                            <h2>{selectedKeyItem.icon} {selectedKeyItem.title}</h2>
                        </div>
                        <antd.Divider type="horizontal" dashed />
                        {componentsMap[this.state.selectedKey]}
                    </React.Fragment>
                </antd.Drawer>

            </div>
        )
    }
}