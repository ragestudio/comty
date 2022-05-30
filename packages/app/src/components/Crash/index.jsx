import React from "react"
import { Result, Button } from "antd"

import "./index.less"

export const CrashComponent = (props) => {
    const { crash } = props

    return <Result
        status="error"
        title="Well, we're sorry! The application has a fatal crash."
        subTitle={crash.message}
        extra={[
            <Button type="primary" key="reload" onClick={() => window.location.reload()}>
                Reload app
            </Button>
        ]}
    >
        <div>
            <code>{crash.details}</code>
        </div>
    </Result>
}

export const CrashWrapper = (props) => {
    const { crash } = props

    return <div className="crashWrapper">
        <CrashComponent crash={crash} />
    </div>
}

export default CrashComponent