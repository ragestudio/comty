import React from "react"
import * as antd from "antd"
import { Translation } from "react-i18next"

import { PagePanelWithNavMenu } from "components/PagePanels"

import { Icons } from "components/Icons"

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
            onTabChange={() => {
                app.layout.scrollTo({
                    top: 0,
                })
            }}
            useSetQueryType
            transition
            masked
        />
    }
}