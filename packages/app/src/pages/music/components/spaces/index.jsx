import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"

import "./index.less"

export default () => {
    const [spaces, setSpaces] = React.useState([])
    const [loading, setLoading] = React.useState(true)

    const onClickCreate = () => {
        
    }

    return <div className="spacesExplorer">
        <div className="spacesExplorer_header">
            <div className="spacesExplorer_header_title">
                <h1>
                    <Icons.MdDeck /> Spaces
                    <antd.Tag color="blue">Beta</antd.Tag>
                </h1>
                <p>
                    Join or create a space to start listening a synchronized music along the room            </p>
            </div>

            <div className="spacesExplorer_header_actions">
                <antd.Button
                    type="primary"
                    icon={<Icons.PlusCircle />}
                >
                    Create
                </antd.Button>
            </div>
        </div>
    </div>
}