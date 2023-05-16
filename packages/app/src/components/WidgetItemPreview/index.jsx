import React from "react"
import * as antd from "antd"
import Image from "components/Image"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const { manifest } = props

    const isInstalled = app.cores.widgets.isInstalled(manifest._id)
    const isVisible = app.cores.widgets.isVisible(manifest._id)

    const removeItem = () => {
        antd.Modal.confirm({
            title: "Are you sure?",
            content: "Do you want to remove this widget?",
            okText: "Yes",
            okType: "danger",
            cancelText: "No",
            onOk: () => {
                props.onRemove()
            }
        })
    }

    if (!manifest) {
        return <div className="widget_preview_item">
            <antd.Result
                status="warning"
                title="Failed to load widget"
            />
        </div>
    }

    return <div key={props.key ?? manifest._id} id={manifest._id} className="widget_preview_item">
        <div className="widget_preview_item_info">
            {
                manifest.iconUrl && <div className="widget_preview_item_info_icon">
                    <Image src={manifest.iconUrl} />
                </div>
            }

            <div className="widget_preview_item_info_title">
                <h1>
                    {
                        manifest.name
                    }
                </h1>

                <p>
                    {
                        manifest.description
                    }
                </p>
                v{
                    manifest.version
                }
            </div>
        </div>

        <div className="widget_preview_item_actions">
            {
                isInstalled && <antd.Switch
                    checkedChildren={<Icons.Eye />}
                    unCheckedChildren={<Icons.EyeOff />}
                    defaultChecked={isVisible}
                    onChange={(checked) => {
                        props.onChangeVisible(checked)
                    }}
                />
            }

            <antd.Button
                icon={isInstalled ? <Icons.MdSync /> : <Icons.Plus />}
                onClick={isInstalled ? props.onUpdate : props.onInstall}
                type={isInstalled ? "default" : "primary"}
            />

            {
                isInstalled && <antd.Button
                    type="primary"
                    icon={<Icons.Trash />}
                    onClick={() => {
                        removeItem()
                    }}
                    danger
                />
            }
        </div>
    </div>
}