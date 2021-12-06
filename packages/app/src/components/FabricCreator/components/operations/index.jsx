import React from "react"
import * as antd from "antd"
import "./index.less"

const api = window.app.request

export default class Operations extends React.Component {
    state = {
        list: []
    }

    componentDidMount = async () => {
        await this.loadOperations()
    }

    loadOperations = async () => {
        const operations = await api.get.operations()
        console.log(operations)
    }

    renderItem = (item) => {
        console.log(item)
        
        return <antd.List.Item>
            {item}
        </antd.List.Item>
    }

    render() {
        return <div className="operations">
            <antd.List 
                dataSource={this.state.list}
                renderItem={this.renderItem}
            />
        </div>
    }
}