import React from "react"
import { Translation } from "react-i18next"

import { PagePanelWithNavMenu } from "@components/PagePanels"

import Tabs from "./tabs"

export default class Home extends React.Component {
    render() {
        return <PagePanelWithNavMenu
            tabs={Tabs}
            extraItems={[
                {
                    key: "create",
                    icon: "FiPlusCircle",
                    label: <Translation>{(t) => t("Create")}</Translation>,
                    props: {
                        type: "primary",
                        onClick: app.controls.openPostCreator
                    }
                },
            ]}
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