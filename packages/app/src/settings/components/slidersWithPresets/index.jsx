import React from "react"
import { Select, Input, Button, Modal } from "antd"

import { Icons } from "@components/Icons"

import Sliders from "../sliderValues"

export default (props) => {
    const [selectedPreset, setSelectedPreset] = React.useState(props.controller.presets.currentPresetKey)
    const [presets, setPresets] = React.useState(props.controller.presets.presets ?? {})

    const createPreset = (key) => {
        setPresets(props.controller.createPreset(key))
        setSelectedPreset(key)
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

    const handleDeletePreset = () => {
        Modal.confirm({
            title: "Delete preset",
            content: "Are you sure you want to delete this preset?",
            onOk: () => {
                props.controller.deletePreset(selectedPreset)
                setPresets(props.controller.presets.presets ?? {})
                setSelectedPreset(props.controller.presets.currentPresetKey)
            }
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
        const presets = props.controller.presets.presets ?? {}
        const preset = presets[selectedPreset]

        if (props.controller.presets.currentPresetKey !== selectedPreset) {
            props.controller.changePreset(selectedPreset)
        }

        props.ctx.updateCurrentValue(preset)
    }, [selectedPreset])

    return <>
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
            }}
        >
            <Icons.MdList
                style={{
                    margin: "0"
                }}
            />
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
                onClick={handleDeletePreset}
                icon={<Icons.MdDelete />}
                disabled={selectedPreset === "default"}
            />
        </div>

        <Sliders
            {...props}
        />
    </>
}