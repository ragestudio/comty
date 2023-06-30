import React from "react"
import classnames from "classnames"
import * as antd from "antd"

import "./index.less"

const NavMenu = (props) => {
    const handleOnClickItem = (event) => {
        return props.onClickItem(event.key)
    }

    return <div className="navmenu_wrapper">
        <div className="card">
            {
                props.header && <div className="card_header">
                    {props.header}
                </div>
            }

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
    function handleClickItem(item) {
        if (item.children && Array.isArray(item.children)) {
            return false
        }

        return props.onClickItem(item.key)
    }

    return <div
        className={classnames(
            "__mobile__navmenu_wrapper",
        )}
    >
        {
            props.items.map((item) => {
                if (!item.disabled && item.children && Array.isArray(item.children)) {
                    return <antd.Dropdown
                        trigger={["click"]}
                        menu={{
                            items: item.children,
                            onClick: (item) => {
                                handleClickItem(item)
                            }
                        }}
                    >
                        <antd.Button
                            key={item.key}
                            className={classnames(
                                "__mobile__navmenu_item",
                                item.key === props.activeKey && "active",
                            )}
                            type="ghost"
                            disabled={item.disabled}
                        >
                            <div className="icon">
                                {item.icon}
                            </div>
                        </antd.Button>
                    </antd.Dropdown>
                }

                return <antd.Button
                    key={item.key}
                    className={classnames(
                        "__mobile__navmenu_item",
                        item.key === props.activeKey && "active",
                    )}
                    onClick={() => handleClickItem(item)}
                    type="ghost"
                    disabled={item.disabled}
                >
                    <div className="icon">
                        {item.icon}
                    </div>
                </antd.Button>
            })
        }
    </div>
}

export default app.isMobile ? NavMenuMobile : NavMenu