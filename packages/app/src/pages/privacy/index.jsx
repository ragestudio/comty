import React from "react"
import MarkdownReader from "@components/MarkdownReader"

import config from "@config"

const PrivacyReader = () => {
    return <MarkdownReader
        url={config.legal.privacy}
    />
}

export default PrivacyReader