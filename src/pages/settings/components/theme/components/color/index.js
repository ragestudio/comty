import React from 'react'
import * as Icons from 'components/Icons'
import * as antd from 'antd'
import styles from '../../index.less'
import ThemeConfigurator from '../../configurator'

export default class Colors extends ThemeConfigurator {
    state = {
        configKey: "colors",
        model: { active: false }
    }
    render() {
        return (
            <div className={styles.background_image_controls} >
                <div>
                   
                   
                </div>
            </div>
        )
    }
}
