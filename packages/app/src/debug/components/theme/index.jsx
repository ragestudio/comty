import React from "react"
import * as antd from "antd"
import ReactJSON from "react-json-view"

import "./index.less"

export default class ThemeDebug extends React.Component {
    state = {
        currentVariant: null,
        rootVariables: null,
    }

    componentDidMount = async () => {
        await this.setValues()
    }

    setValues = async () => {
        const currentVariant = document.documentElement.style.getPropertyValue("--themeVariant")
        const rootVariables = window.app.ThemeController.getRootVariables()

        this.setState({ currentVariant, rootVariables })
    }

    editValues = async (values) => {
        console.log(values)
        await window.app.ThemeController.update({ [values.name]: values.new_value })
        await this.setState({ rootVariables: values.updated_src })
    }

    setDefaults = async () => {
        await window.app.ThemeController.resetDefault()
        await this.setValues()
    }

    render() {
        return <div className="themeDebugger">
            <div>
                <antd.Button onClick={this.setDefaults}>
                    default
                </antd.Button>
            </div>
            <div>
                Current variant: <antd.Tag>{this.state.currentVariant}</antd.Tag>
            </div>

            <div>
                <ReactJSON 
                    src={this.state.rootVariables}
                    onEdit={this.editValues}
                    />
            </div>
        </div>
    }
}