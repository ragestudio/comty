import React from "react"
import { Translation } from "react-i18next"

import { PagePanelWithNavMenu } from "@components/PagePanels"

import usePageWidgets from "@hooks/usePageWidgets"

import Tabs from "./tabs"

const TrendingsCard = () => {
    return <div className="card">
        <div className="card-header">
            <span>Trendings</span>
        </div>

        <div className="card-content">
            <span>XD</span>
        </div>
    </div>
}

const TimelinePage = () => {
    usePageWidgets([
        {
            id: "trendings",
            component: TrendingsCard
        }
    ])

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

export default TimelinePage