import React from 'react'
import * as antd from 'antd'
import * as core from 'core'
import { connect } from 'umi'

@connect(({ app, extended }) => ({ app, extended }))
export default class CoreDebug extends React.Component {
    state = {
        rawPluginInitInput: null
    }
    handleInitPlugin(e){
        this.props.dispatch({
            type: "app/initializePlugins",
            payload: {
                array: e
            }
        })
    }
    render(){
        const handleGenerateUUID = () => { console.log(core.generateUUID()) }
        const handleChange = (e) => { this.setState({ rawPluginInitInput: e.target.value }) }
        return(
            <div>
                <antd.Button onClick={() => handleGenerateUUID()} >generate uuid</antd.Button>
                <antd.Card>
                    <antd.Input onChange={handleChange} value={this.state.rawPluginInitInput} placeholder="https://api.ragestudio.net/std/example.js" />
                    <antd.Button onClick={() => { this.handleInitPlugin(this.state.rawPluginInitInput) }} > init </antd.Button>
                </antd.Card>
            </div>
        )
    }
}