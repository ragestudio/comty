import React from "react"

import { Icons } from "components/Icons"

import { PagePanelWithNavMenu } from "components/PagePanels"

import Tabs from "./tabs"

const NavMenuHeader = <h2>
    <Icons.MdLiveTv />
    TV
</h2>

export default class TVDashboard extends React.Component {
    render() {
        return <PagePanelWithNavMenu
            tabs={Tabs}
            navMenuHeader={NavMenuHeader}
            useSetQueryType
            transition
        />
    }
}