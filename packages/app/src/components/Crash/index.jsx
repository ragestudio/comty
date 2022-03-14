import React from "react"
import { Result, Button } from "antd"

export default (props) => {
    const { crash } = props

    return <div className="app_crash_wrapper">
        <Result
            status="error"
            title="Crash"
            subTitle={crash.message}
            extra={[
                <Button type="primary" key="reload" onClick={() => window.location.reload()}>
                    Reload app
                </Button>
            ]}
        >
            <div>
                <code>{crash.error}</code>
            </div>
        </Result>
    </div>
}