import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
    Result,
    Skeleton
} from "antd"

import "./index.less"

export default (props) => {
    const [L_Doc, R_Doc, E_Doc] = app.cores.api.useRequest(async () => {
        const response = await app.cores.api.customRequest({
            method: "GET",
            url: props.url,
        })

        return response.data
    })

    React.useEffect(() => {
        app.layout.toggleCenteredContent(true)

        return () => {
            app.layout.toggleCenteredContent(false)
        }
    }, [])

    if (E_Doc) {
        return <Result
            status="warning"
            title="Cannot load this document"
            subTitle="Something went wrong, please try again later."
        />
    }

    if (L_Doc) {
        return <Skeleton active />
    }

    return <div className="document_viewer">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {R_Doc}
        </ReactMarkdown>
    </div>
}