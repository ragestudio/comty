import React from "react"
import * as antd from "antd"
import { SelectableList, ActionsBar } from "components"

import "./index.less"

export default class Streams extends React.Component {
    state = {
        list: [],
    }

    api = window.app.request

    componentDidMount = async () => {
        await this.updateStreamsList()
    }

    updateStreamsList = async () => {
        let streams = await this.api.get.streams().catch(error => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        if (streams && Array.isArray(streams)) {
            // resolve user_id with user basic data
            streams = streams.map(async (stream) => {
                const userData = await this.api.get.user(undefined, { user_id: stream.user_id }).catch((error) => {
                    console.error(error)
                    antd.message.error(error)

                    return false
                })

                if (userData) {
                    stream.userData = userData
                }

                return stream
            })

            streams = await Promise.all(streams)
        }

        this.setState({ list: streams })
    }

    onClickItem = (item) => {
        window.app.setLocation(`/streams/viewer?key=${item}`)
    }

    renderListItem = (stream) => {
        return <div
            key={stream.id}
            onClick={() => this.onClickItem(stream.username)}
            className="streaming-item"
        >
            <div className="thumbnail">
                <img src={stream.userData.avatar} alt={stream.userData.username} />
            </div>
            <div className="details">
                <div className="title">
                    <h1>@{stream.userData.username}</h1>
                    <span>
                        #{stream.id}
                    </span>
                </div>
            </div>
        </div>
    }

    render() {
        return <div className="streams">
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