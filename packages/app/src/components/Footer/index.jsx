import React from "react"
import config from "config"

import "./index.less"

export default (props) => {
    const renderLinks = () => {
        return config.footerLinks.map((link, index) => {
            let linkProps = {
                key: index,
            }

            if (link.url) {
                linkProps.href = link.url
            }

            if (link.location) {
                linkProps.onClick = () => {
                    app.setLocation(link.location)
                }
            }

            return <>| <a {...linkProps}>{link.label}</a> {index === config.footerLinks.length - 1 ? "|" : ""} </>
        })
    }
    return <div className="footer">
        {config.app.siteName} - {config.author} {config.footerLinks ? renderLinks() : null}
    </div>
}