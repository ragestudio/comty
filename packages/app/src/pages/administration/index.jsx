import React from "react"
import * as antd from "antd"
import { Icons, createIconRender } from "components/Icons"

import "./index.less"

const toolMap = {
    userTools: {
        label: "User Tools",
        icon: "user",
        children: [
            {
                label: "User List",
                icon: "user",
                path: "/administration/users/list",
            }
        ]
    }
}

export default (props) => {
    const generateMenu = (toolMap) => {
        return Object.keys(toolMap).map((tool) => {
            const toolData = toolMap[tool]

            return (
                <antd.Menu.Item key={tool}>
                    {createIconRender(toolData.icon)}
                    <span>{toolData.label}</span>
                </antd.Menu.Item>
            )
        })
    }

    return <div className="administation">
        <h1>Administration</h1>

        <div className="menus">
            <antd.Menu
                mode="inline"
                defaultSelectedKeys={["userTools"]}
                defaultOpenKeys={["userTools"]}
                style={{ height: "100%", borderRight: 0 }}
            >
                {generateMenu(toolMap)}
            </antd.Menu>
        </div>
    </div>
}