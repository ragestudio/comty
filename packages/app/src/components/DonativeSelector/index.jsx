import React from "react"
import { Translation } from "react-i18next"

import Config from "@config"

import "./index.less"

const DonativeSelector = () => {
    return <div className="donative-selector">
        <h2>✨<Translation>{t => t("Support us to continue improving ")}</Translation>{Config.app.siteName}!✨</h2>
        <p><Translation>{t => t("Your contribution will help us continue to develop new features and improve our platform experience.")}</Translation></p>
        <p><Translation>{t => t("Every donation, no matter how small, makes a difference and allows us to continue building a stronger community.")}</Translation></p>

        <div className="donative-selector_channels">
            {
                Config.donatives.map((channel) => {
                    return <a
                        key={channel.name}
                        href={channel.href}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <img
                            src={channel.icon}
                            alt={channel.name}
                        />
                    </a>
                })
            }
        </div>
    </div>
}


export default DonativeSelector