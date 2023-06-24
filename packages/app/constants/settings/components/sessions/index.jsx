import React from "react"
import { Button } from "antd"

export default (props) => {
    return <Button
        onClick={() => {
            app.location.push("/security/sessions")
            props.ctx.close()
        }}
    >
        Check activity
    </Button>
}