import React from 'react'
import axios from "axios"
import * as antd from "antd"
import { SelectableList } from "components"

// http://192.168.1.144:8080/live/srgooglo_ff.m3u8
const streamsApi = "http://media.ragestudio.net/api"
const bridge = axios.create({
    baseURL: streamsApi,
    auth: {
        username: "admin",
        password: "sharedpass1414"
    }
})

export default class Streams extends React.Component {
    state = {
        list: {},
    }

    updateStreamsList = async () => {
        const streams = ((await bridge.get("/streams")).data).live
        this.setState({ list: streams })
    }

    componentDidMount = async () => {
        this.updateStreamsList()
    }

    onClickItem = (item) => {
        window.app.setLocation(`/streams/viewer?key=${item}`)
    }

    renderListItem = (key) => {
        const streaming = this.state.list[key]
        console.log(streaming)
        return <div key={streaming.publisher.clientId} onClick={() => this.onClickItem(key)}>
            <h1>@{streaming.publisher.stream} #{streaming.publisher.clientId}</h1>
        </div>
    }

    render() {
        return <div>
            <h1>Streams</h1>
            <div>
                <SelectableList 
                    selectionEnabled={false}
                    renderItem={this.renderListItem}
                    items={Object.keys(this.state.list)}
                />
            </div>
        </div>
    }
}