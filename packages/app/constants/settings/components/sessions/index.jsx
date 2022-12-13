import React from "react"
import { Button } from "antd"

export default (props) => {
    return <Button
        onClick={() => {
            app.setLocation("/security/sessions")
            props.ctx.close()
        }}
    >
        Check activity
    </Button>
}