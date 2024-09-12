import React from "react"

import "./index.less"

const AppMenu = (props) => {
    // TODO: Fetch from app core
    const installedApps = []

    return <div className="apps-menu">
        <h1>Apps</h1>

        {
            installedApps.map((item) => {
                return <div
                    key={item.key}
                    className="apps-menu-item"
                    onClick={() => {
                        if (item.location) {
                            app.location.push(item.location)
                        }

                        props.close()
                    }}
                >
                    <h3>{item.icon && createIconRender(item.icon)} {item.label}</h3>
                </div>
            })
        }

        {
            installedApps.length === 0 && <Empty
                description="No apps installed"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        }
    </div>
}

export default AppMenu