import React from "react"

import { createIconRender } from "components/Icons"

import "./index.less"

export default (props) => {
    const { items = [], cords, clickedComponent, ctx } = props

    const handleItemClick = async (item) => {
        if (typeof item.action === "function") {
            await item.action(clickedComponent, ctx)
        }
    }

    const renderItems = () => {
        if (items.length === 0) {
            return <div>
                <p>No items</p>
            </div>
        }

        return items.map((item, index) => {
            if (item.type === "separator") {
                return <div key={index} className="context-menu-separator" />
            }

            return <div
                key={index}
                onClick={() => handleItemClick(item)}
                className="item"
            >
                <p className="label">
                    {item.label}
                </p>
                {item.description && <p className="description">
                    {item.description}
                </p>}
                {createIconRender(item.icon)}
            </div>
        })
    }

    return <div
        className="contextMenu"
        style={{
            top: cords.y,
            left: cords.x,
        }}
    >
        {renderItems()}
    </div>
}