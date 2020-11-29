import React from 'react'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import styles from '../../index.less'
import ThemeConfigurator from '../../configurator'

export default class DarkMode extends ThemeConfigurator {
    state = {
        configKey: "darkmode",
        model: { active: false }
    }
    render() {
        return (
            <div className={styles.background_image_controls} >
                <div>
                    <h4><Icons.Eye />Enabled</h4>
                    <antd.Switch
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                        onChange={(e) => { this.promiseState(prevState => ({ model: { ...prevState.model, active: e } })).then(() => this.handleUpdate()) }}
                        checked={this.state.model.active}
                    />
                </div>
            </div>
        )
    }
}