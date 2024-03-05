import React from "react"
import * as antd from "antd"
import Image from "components/Image"
import { Icons } from "components/Icons"

import "./index.less"

export default React.memo((props) => {
    const { manifest } = props

    const [installed, setInstalled] = React.useState(app.cores.widgets.isInstalled(manifest._id))
    const [visible, setVisible] = React.useState(app.cores.widgets.isVisible(manifest._id))

    const handleItemRemove = () => {
        antd.Modal.confirm({
            title: "Are you sure?",
            content: "Do you want to remove this widget?",
            okText: "Yes",
            okType: "danger",
            cancelText: "No",
            onOk: () => {
                onRemove()
            }
        })
    }

    const onRemove = async () => {
        if (typeof props.onRemove !== "function") {
            console.error("onRemove is not a function")
            return false
        }

        await props.onRemove()

        setInstalled(false)
    }

    const onUpdate = async () => {
        if (typeof props.onUpdate !== "function") {
            console.error("onUpdate is not a function")
            return false
        }

        props.onUpdate()
    }

    const onInstall = async () => {
        if (typeof props.onInstall !== "function") {
            console.error("onInstall is not a function")
            return false
        }

        await props.onInstall()

        setVisible(true)
        setInstalled(true)
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
                manifest.icon && <div className="widget_preview_item_info_icon">
                    <Image src={manifest.icon} />
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
                installed && <antd.Switch
                    checkedChildren={<Icons.Eye />}
                    unCheckedChildren={<Icons.EyeOff />}
                    onChange={(checked) => {
                        props.onChangeVisible(checked)
                        setVisible(checked)
                    }}
                    checked={visible}
                />
            }

            <antd.Button
                icon={installed ? <Icons.MdSync /> : <Icons.Plus />}
                onClick={installed ? onUpdate : onInstall}
                type={installed ? "default" : "primary"}
            />

            {
                installed && <antd.Button
                    type="primary"
                    icon={<Icons.Trash />}
                    onClick={handleItemRemove}
                    danger
                />
            }
        </div>
    </div>
})