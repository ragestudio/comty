import React from 'react'
import settings from 'core/libs/settings'
import verbosity from 'core/libs/verbosity'
import * as antd from 'antd'

const verbosity_enabled = settings('verbosity')
export default class Verbosity extends React.Component{
    state = {

    }

    componentDidMount(){
        verbosity("Single text test")
    }
    
    handleSend(){
        const { raw0, raw1, color, type, method, line, file, time } = this.state
        let data = []
        let params = { color, type}
        let stackTraceParams = { line, file, time, method }

        if (typeof(raw0) !== "undefined") {
            data[0] = raw0
        }
        if (typeof(raw1) !== "undefined") {
            data[1] = raw1
        }

        verbosity(
            data,
            params,
            stackTraceParams
        )
    }

    render(){
        const handleRawChange = (e) => {
            const obj = {}
            obj[e.target.id] = e.target.value
            this.setState(obj)
        }
        const handleCheckChange = (e) => {
            const obj = {}
            obj[e.target.id] = e.target.checked
            this.setState(obj)
        }
        return(
            <div>
                verbosity => {verbosity_enabled ? "enabled" : "disabled"}
                <antd.Card> 
                    <antd.Input id="raw0" onChange={handleRawChange} placeholder="Data 1 (string)" />    
                    <antd.Input id="raw1" onChange={handleRawChange} placeholder="Data 2 (string)" />    
                    <div style={{ display: "flex", marginTop: "20px" }}>
                        <antd.Button type="primary" onClick={() => this.handleSend()}> send </antd.Button>
                        <antd.Select style={{ width: "200px" }} onChange={(e) => {this.setState({ type: e})}} >
                            <antd.Select.Option value="log"> log </antd.Select.Option>
                            <antd.Select.Option value="debug"> debug </antd.Select.Option>
                            <antd.Select.Option value="error"> error </antd.Select.Option>
                        </antd.Select>    
                        <antd.Input id="color" onChange={(e) => handleRawChange(e)} placeholder="color" />
                        <antd.Checkbox id="method" onChange={handleCheckChange}> method </antd.Checkbox>
                        <antd.Checkbox id="line" onChange={handleCheckChange}> line </antd.Checkbox>
                        <antd.Checkbox id="file" onChange={handleCheckChange}> file </antd.Checkbox>
                        <antd.Checkbox id="time" onChange={handleCheckChange}> time </antd.Checkbox>
                    </div>
                </antd.Card> 
            </div>
        )
    }
}