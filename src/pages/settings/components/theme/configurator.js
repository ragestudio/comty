import React from 'react'
import ErrorHandler from 'core/libs/errorhandler'
import { theme } from 'core/libs/style'
import exportDataAsFile from 'core/libs/appInterface/export_data'
import verbosity from 'core/libs/verbosity'

export default class ThemeConfigurator extends React.Component {
    componentDidMount() {
        this.applyStoraged()
    }

    applyStoraged() {
        const storaged = theme.get()
        if (storaged && this.state) {
            if (storaged[this.state.configKey]) {
                return this.setState({ model: storaged[this.state.configKey] })
            } else {
                return verbosity(`cannot get storagedSetting for ${this.state.configKey}`)
            }
        }
    }

    promiseState = async state => new Promise(resolve => this.setState(state, resolve));

    handleUpdate(payload) {
        if (!this.state.configKey) {
            return ErrorHandler({ msg: `cannot update without 'configKey', is missing`, code: 140 })
        }
        if (!payload) {
            payload = this.state.model
        }
        this.setState({ model: payload, processing: false })
        window.dispatcher({
            type: 'app/updateTheme',
            payload: {
                key: this.state.configKey,
                value: payload
            }
        });
    }

    handleErase() {
        this.handleUpdate({})
    }

    handleExport() {
        exportDataAsFile({ data: JSON.stringify(this.state.model), type: 'text/json' })
    }

}
