import React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import { connect } from 'umi'
import { __legacy__objectToArray } from '@ragestudio/nodecore-utils'
import classnames from 'classnames'

import StatisticConnection from './statistics/connection'

const statisticsComponents = {
    connection: <StatisticConnection />
}

const statisticsList = [
    {
        id: "connection",
        title: <span><Icons.GitMerge /> Network</span>,
        help: "Measure your connection with our servers",
        default: true
    },
    {
        id: "audience",
        title: <span><Icons.Eye /> Audience</span>,
        help: "Blah blah blah",
        default: false
    }
]

@connect(({ app, streaming }) => ({ app, streaming }))
export default class StreamingPanel extends React.Component {

    state = {
        activeStatistics: [],
        hidden: {}
    }

    isHidden(key) {
        if (typeof (this.state.hidden[key]) == "undefined") {
            return true
        }

        return this.state.hidden[key]
    }

    handleHidden(key) {
        let updated = this.state.hidden

        if (typeof (this.state.hidden[key]) == "undefined") {
            updated[key] = false
        } else {
            updated[key] = !this.state.hidden[key]
        }

        this.setState({ hidden: updated })
    }

    renderLiveTag() {
        return <div className={classnames(window.classToStyle("streamingPanel_onlivetag"), { ["active"]: this.props.streaming?.onStreaming })} >
            {this.props.streaming?.onStreaming ? "On Live" : "Offline"}
        </div>
    }

    renderOptions() {
        return (
            <div className={window.classToStyle("streamingPanel_cardBody")}>
                <div>
                    <h1><Icons.Activity /> Information </h1>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div className={classnames(window.classToStyle("streamingPanel_connectionIndicator"), { ["active"]: this.props.streaming?.isConnected })} >  </div>
                    {this.props.streaming?.isConnected ? "Connected" : "Disconnected"}
                </div>
                <div>
                    <antd.Tag><Icons.Eye /> 0 Viewers </antd.Tag>
                </div>

            </div>
        )
    }

    renderStadistics() {
        const { isConnected, spectators } = this.props.streaming

        const onChangeCheckbox = (e) => {
            let updated = this.state.activeStatistics
            updated[e] = !updated[e]

            this.setState({ updated })
        }

        const getCheckboxes = () => {
            return statisticsList.map(e => {
                if (!e.id) {
                    return null
                }
                return <antd.Tooltip key={e.id} title={e.help} >
                    <antd.Checkbox onChange={() => { onChangeCheckbox(e.id) }} defaultChecked={e.default} checked={this.state.activeStatistics[e.id]} key={e.id} >
                        {e.title ?? e.id}
                    </antd.Checkbox>
                </antd.Tooltip>
            })
        }

        const renderCharts = () => {
            return __legacy__objectToArray(this.state.activeStatistics).map((e) => {
                if (e.value) {
                    return statisticsComponents[e.key]
                }
                return null
            })
        }

        return (
            <div>
                <div>
                    {getCheckboxes()}
                </div>
                <div>
                    {renderCharts()}
                </div>
            </div>
        )
    }


    render() {
        console.log(this.props.streaming)
        return (
            <div id="streamingWrapper" className={window.classToStyle("streamingPanel_wrapper")} >
                <h1><Icons.Radio /> Your streaming</h1>
                <div className={window.classToStyle("streamingPanel_content")}>
                    <div style={{ float: "left", display: "flex", fontSize: "27px", alignItems: "center", maxWidth: "80%" }}>
                        <antd.Avatar style={{ width: "70px", height: "70px", marginRight: "17px" }} src={this.props.app.session_data.avatar} size="large" shape="square" />
                        <h1 style={{ color: "#333", margin: 0 }}> @{this.props.app.session_data.username} </h1>
                    </div>
                    <div style={{ float: "right", width: "100px" }} >
                        {this.renderLiveTag()}
                    </div>
                </div>
                <div style={{ padding: "25px 40px" }} className={window.classToStyle("streamingPanel_content")}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gridTemplateRows: "1fr",
                        gap: "0px 20px"
                    }}>
                        {this.renderOptions()}
                        {this.renderStadistics()}
                    </div>
                </div>
            </div>
        )
    }
}