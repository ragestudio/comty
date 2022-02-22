import React from 'react'
import axios from "axios"
import * as antd from "antd"
import { SelectableList, ActionsBar } from "components"

export default class Streams extends React.Component {
    state = {
        list: [],
    }

    api = window.app.request

    componentDidMount = async () => {
        await this.updateStreamsList()
    }

    updateStreamsList = async () => {
        const streams = await this.api.get.streams().catch(error => {
            console.error(error)
            antd.message.error(error)
            
            return false
        })

        this.setState({ list: streams })
    }


    onClickItem = (item) => {
        window.app.setLocation(`/streams/viewer?key=${item}`)
    }

    renderListItem = (stream) => {
        stream.StreamPath = stream.StreamPath.replace(/^\/live\//, "")
        
        return <div key={stream.id} onClick={() => this.onClickItem(stream.StreamPath)}>
            <h1>@{stream.StreamPath} #{stream.id}</h1>
        </div>
    }

    render() {
        return <div>
            <ActionsBar mode="float">
                <div>
                    <antd.Button onClick={this.updateStreamsList}>Refresh</antd.Button>
                </div>
            </ActionsBar>
            <div>
                <SelectableList 
                    selectionEnabled={false}
                    renderItem={this.renderListItem}
                    items={this.state.list}
                />
            </div>
        </div>
    }
}