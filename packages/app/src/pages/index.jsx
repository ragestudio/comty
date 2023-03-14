import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { PagePanelWithNavMenu } from "components/PagePanels"

import { Icons } from "components/Icons"

import { HashtagTrendings, FeaturedEventsAnnouncements, ConnectedFriends } from "components"

import Tabs from "./posts/tabs"

export default class Dashboard extends React.Component {
    render() {
        const navMenuHeader = <>
            <h1>
                <Icons.MdTag />
                <Translation>{(t) => t("Posts")}</Translation>
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

                <FeaturedEventsAnnouncements />
            </>
        }

        return <PagePanelWithNavMenu
            tabs={Tabs}
            navMenuHeader={navMenuHeader}
            extraPanel={extraPanel}
            primaryPanelClassName="full"
            useSetQueryType
            transition
        />
    }
}