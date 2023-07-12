import React from "react"
import MarkdownReader from "components/MarkdownReader"
import config from "config"

export default () => {
    return <MarkdownReader
        url={config.legal.privacy}
    />
}