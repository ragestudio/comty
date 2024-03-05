import React from "react"
import classnames from "classnames"
import { createIconRender } from "components/Icons"

export const QuickNavMenuItems = [
    {
        id: "music",
        icon: "MdAlbum",
        label: "Music",
        location: "/music"
    },
    {
        id: "tv",
        icon: "Tv",
        label: "Tv",
        location: "/tv"
    },
    {
        id: "groups",
        icon: "MdGroups",
        label: "Groups",
        location: "/groups",
        disabled: true,
    },
    {
        id: "marketplace",
        icon: "Box",
        label: "Marketplace",
        location: "/marketplace",
        disabled: true
    },
]

export const QuickNavMenu = ({
    visible,
}) => {
    return <div
        className={classnames(
            "quick-nav",
            {
                ["active"]: visible
            }
        )}
    >
        {
            QuickNavMenuItems.map((item, index) => {
                return <div
                    key={index}
                    className={classnames(
                        "quick-nav_item",
                        {
                            ["disabled"]: item.disabled
                        }
                    )}
                    quicknav-item={item.id}
                    disabled={item.disabled}
                >
                    {
                        createIconRender(item.icon)
                    }
                    <h1>

                        {
                            item.label
                        }
                    </h1>
                </div>
            })
        }
    </div>
}

export default QuickNavMenu