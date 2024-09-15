import React from "react"

import { PagePanelWithNavMenu } from "@components/PagePanels"

import Tabs from "./tabs"

export default class Home extends React.Component {
    componentDidMount() {
        app.layout.toggleCenteredContent(false)
    }

    render() {
        return <PagePanelWithNavMenu
            tabs={Tabs}
            primaryPanelClassName="full"
            useSetQueryType
            transition
        />
    }
}