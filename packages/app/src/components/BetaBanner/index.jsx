import React from "react"
import { Alert, Button } from "antd"
import { Translation } from "react-i18next"

import DonativeSelector from "@components/DonativeSelector"

import Config from "@config"

import "./index.less"

const BetaBanner = () => {
    const [closed, setClosed] = React.useState(false)

    function openDonativeSelector() {
        setClosed(true)

        app.layout.modal.open("donate", DonativeSelector, {
            closable: true,
        })
    }

    function setAsViewed() {
        localStorage.setItem("welcome_beta", true)
        setClosed(true)
    }

    if (localStorage.getItem("welcome_beta") === true || closed) {
        return null
    }

    return <div className="beta-banner-wrapper">
        <Alert
            closable
            type="warning"
            message={<div className="welcome-beta-banner">
                <div className="welcome-beta-banner-title">
                    <h3>🎉 <Translation>{t => t("Welcome to")}</Translation> {Config.app.siteName} Beta</h3>
                </div>

                <div className="welcome-beta-banner-content">
                    <p><Translation>{t => t("We're glad to have you here, we hope you enjoy the first public beta.")}</Translation></p>
                    <p><Translation>{t => t("You can help us continue to improve the platform by supporting us with donations.")}</Translation></p>
                </div>

                <div className="welcome-beta-banner-actions">
                    <Button
                        type="primary"
                        onClick={openDonativeSelector}
                    >
                        <Translation>{t => t("Donate")}</Translation>
                    </Button>

                    <Button
                        type="default"
                        onClick={setAsViewed}
                    >
                        <Translation>{t => t("Got it")}</Translation>
                    </Button>
                </div>
            </div>}
        />
    </div>
}

export default BetaBanner