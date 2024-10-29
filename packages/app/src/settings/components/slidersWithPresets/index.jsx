import React from "react"
import { Select, Input, Button, Modal } from "antd"

import { Icons } from "@components/Icons"

import Sliders from "../sliderValues"

export default (props) => {
    const [selectedPreset, setSelectedPreset] = React.useState(props.controller.currentPresetKey)
    const [presets, setPresets] = React.useState(props.controller.presets ?? {})

    const createPreset = (key) => {
        const presets = props.controller.createPreset(key)

        setPresets(presets)
        setSelectedPreset(key)
    }

    const deletePreset = (key) => {
        const presets = props.controller.deletePreset(key)

        setPresets(presets)
        setSelectedPreset(props.controller.currentPresetKey)
    }

    const handleCreateNewPreset = () => {
        app.layout.modal.open("create_preset", (props) => {
            const [presetKey, setPresetKey] = React.useState("")

            return <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    width: "100%",
                }}
            >
                <h3>New preset</h3>

                <Input
                    placeholder="New preset name"
                    value={presetKey}
                    onChange={(e) => {
                        setPresetKey(e.target.value.trim())
                    }}
                />

                <Button
                    type="primary"
                    disabled={!presetKey || presetKey.length === 0}
                    onClick={() => {
                        createPreset(presetKey)

                        props.close()
                    }}
                >
                    Create
                </Button>
            </div>
        })
    }

    const handleDeleteCurrentPreset = () => {
        Modal.confirm({
            title: "Delete preset",
            content: "Are you sure you want to delete this preset?",
            onOk: () => deletePreset(selectedPreset)
        })
    }

    const options = [
        {
            value: "new",
            label: <span><Icons.MdAdd /> Create new</span>,
        },
        ...Object.keys(presets).map((key) => {
            return {
                value: key,
                label: key,
            }
        })
    ]

    React.useEffect(() => {
        const presetValues = props.controller.presets[selectedPreset]

        if (props.controller.currentPresetKey !== selectedPreset) {
            props.controller.changePreset(selectedPreset)
        }

        props.ctx.updateCurrentValue(presetValues)
    }, [selectedPreset])

    return <>
        <Sliders
            {...props}
        />

        <div
            style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                width: "100%",
                backgroundColor: "rgba(var(--bg_color_3), 0.5)",
                padding: "5px 10px",
                borderRadius: "12px",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "5px",
                    width: "100%",
                }}
            >
                <Icons.MdList
                    style={{
                        margin: "0"
                    }}
                />
                <h4
                    style={{
                        margin: "0",
                    }}
                >

                    Preset
                </h4>
            </div>

            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "5px",
                    width: "100%",
                }}
            >
                <Select
                    style={{
                        width: "50%"
                    }}
                    value={selectedPreset}
                    options={options}
                    onChange={(key) => {
                        if (key === "new") {
                            handleCreateNewPreset()
                        } else {
                            setSelectedPreset(key)
                        }
                    }}
                />
                <Button
                    onClick={handleDeleteCurrentPreset}
                    icon={<Icons.MdDelete />}
                    disabled={selectedPreset === "default"}
                />
            </div>
        </div>
    </>
}