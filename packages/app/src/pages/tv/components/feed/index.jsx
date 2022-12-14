import React from "react"
import { Result, Button } from "antd"

import "./index.less"

export default (props) => {
    return <div className="livestreamsFeed">
        <Result
            status="404"
            title="Not implemented"
            subTitle={<>
                <span>Sorry, this feature is not implemented yet</span>
                <br />
                <span>But you can explore all streamings in <a onClick={() => app.setLocation("/tv/explore")}>explore</a> tab</span>
            </>}
        />
    </div>
}