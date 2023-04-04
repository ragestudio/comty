import React from "react"

import { Icons } from "components/Icons"

import { PagePanelWithNavMenu } from "components/PagePanels"

import Tabs from "./tabs"

const NavMenuHeader = <h2>
    <Icons.MdAlbum />
    Music
</h2>

export default () => {
    return <PagePanelWithNavMenu
        tabs={Tabs}
        navMenuHeader={NavMenuHeader}
        useSetQueryType
        transition
    />
}