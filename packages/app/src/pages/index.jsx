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

        const extraPanel = {
            children: <>
                <div className="card" id="trendings">
                    <div className="header">
                        <h2>
                            <Icons.TrendingUp />
                            <Translation>{(t) => t("Trendings")}</Translation>
                        </h2>
                    </div>

                    <HashtagTrendings />
                </div>

                <div className="card" id="onlineFriends">
                    <div className="header">
                        <h2>
                            <Icons.MdPeopleAlt />
                            <Translation>{(t) => t("Online Friends")}</Translation>
                        </h2>
                    </div>

                    <ConnectedFriends />
                </div>

                <WidgetsWrapper />
            </>
        }

        return <PagePanelWithNavMenu
            tabs={Tabs}
            navMenuHeader={navMenuHeader}
            extraMenuItems={[
                <FeaturedEventsAnnouncements />
            ]}
            extraPanel={extraPanel}
            primaryPanelClassName="full"
            useSetQueryType
            transition
        />
    }
}