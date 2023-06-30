import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import WidgetsWrapper from "components/WidgetsWrapper"
import { PagePanelWithNavMenu } from "components/PagePanels"

import { Icons } from "components/Icons"

import { HashtagTrendings, FeaturedEventsAnnouncements, ConnectedFriends } from "components"

import Tabs from "./home/tabs"

export default class Home extends React.Component {
    render() {
        const navMenuHeader = <>
            <h1>
                <Icons.Home />
                <Translation>{(t) => t("Timeline")}</Translation>
            </h1>
            <antd.Button
                type="primary"
                onClick={app.controls.openPostCreator}
            >
                <Icons.PlusCircle />
                <Translation>{(t) => t("Create")}</Translation>
            </antd.Button>
        </>

        return <PagePanelWithNavMenu
            tabs={Tabs}
            navMenuHeader={navMenuHeader}
            primaryPanelClassName="full"
            useSetQueryType
            transition
        />
    }
}