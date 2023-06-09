import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import { createIconRender } from "components/Icons"

import "./index.less"

const NavMenu = (props) => {
    const handleOnClickItem = (event) => {
        return props.onClickItem(event.key)
    }

    return <div className="navmenu_wrapper">
        {
            props.header && <div className="card header" id="navMenu">
                {props.header}
            </div>
        }

        <div className="card content" id="navMenu">
            <antd.Menu
                mode="inline"
                selectedKeys={[props.activeKey]}
                onClick={handleOnClickItem}
                items={props.items}
            />
        </div>
    </div>
}

const NavMenuMobile = (props) => {
    return <div className="__mobile__navmenu_wrapper">
        <div className="card">
            {
                props.items.map((item) => {
                    return <div
                        key={item.key}
                        className={classnames(
                            "item",
                            item.key === props.activeKey && "active",
                        )}
                        onClick={() => props.onClickItem(item.key)}
                    >
                        <div className="icon">
                            {item.icon}
                        </div>

                        <div className="label">
                            {item.label}
                        </div>
                    </div>
                })
            }
        </div>
    </div>
}

export default app.isMobile ? NavMenuMobile : NavMenu