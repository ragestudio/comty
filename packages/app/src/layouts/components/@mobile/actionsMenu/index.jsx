import React from "react"
import classnames from "classnames"
import { Translation } from "react-i18next"

import { createIconRender } from "@components/Icons"

import "./index.less"

const ActionsMenu = (props) => {
    return <div
        className="app-actions_menu"
    >
        {
            props.list.map((action, index) => {
                return <div
                    id={action.id}
                    key={index}
                    onClick={() => {
                        action.onClick()

                        if (action.closeOnClick !== false) {
                            props.close()
                        }
                    }}
                    className={classnames(
                        "app-actions_menu-action",
                        {
                            ["danger"]: action.danger
                        }
                    )}
                >
                    <div
                        className="app-actions_menu-icon"
                    >
                        {createIconRender(action.icon)}
                    </div>

                    <div
                        className="app-actions_menu-label"
                    >
                        <span><Translation>{t => t(action.label)}</Translation></span>
                    </div>
                </div>
            })
        }
    </div>
}

export default ActionsMenu