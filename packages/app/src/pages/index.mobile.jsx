import React from "react"

import { PagePanelWithNavMenu } from "components/PagePanels"

import Tabs from "./home/tabs"

export default class Home extends React.Component {
    render() {
        return <PagePanelWithNavMenu
            tabs={Tabs}
            primaryPanelClassName="full"
            useSetQueryType
            transition
        />
    }
}