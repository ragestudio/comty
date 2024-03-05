import React from "react"
import Slider from "@mui/material/Slider"
import classnames from "classnames"

import "./index.less"

export default (props) => {
    const [values, setValues] = React.useState(props.ctx.currentValue ?? {})

    const handleOnChange = (key, value) => {
        setValues((prev) => {
            return {
                ...prev,
                [key]: value
            }
        })
    }

    const handleChangeCommitted = (key, value) => {
        props.ctx.dispatchUpdate(values)
    }

    const renderValue = (slider) => {
        const currentValue = values[slider.key] ?? 0

        if (slider.valueFormat) {
            return slider.valueFormat(currentValue)
        }

        if (props.valueFormat) {
            return props.valueFormat(currentValue)
        }

        return `${currentValue}`
    }

    React.useEffect(() => {
        if (props.ctx.currentValue) {
            setValues(props.ctx.currentValue)
        }
    }, [props.ctx.currentValue])

    return <div
        className={classnames(
            "values_sliders",
            {
                disabled: props.disabled
            }
        )}
        style={props.style}
    >
        {
            props.sliders.map((slider, index) => {
                return <div key={index} id={slider.key} className="values_sliders_slider">
                    <div className="values_sliders_slider_header">
                        <span>
                            {slider.label}
                        </span>
                    </div>

                    <Slider
                        onChangeCommitted={(e, value) => handleChangeCommitted(slider.key, value)}
                        onChange={(e, value) => handleOnChange(slider.key, value)}
                        value={values[slider.key] ?? 0}
                        orientation="vertical"
                        valueLabelDisplay="off"
                        step={slider.step ?? props.step ?? 0.1}
                        min={slider.min}
                        max={slider.max}
                        disabled={props.disabled}
                        marks={props.marks ?? props.marks}
                    />

                    <div className="values_sliders_slider_value">
                        <span>
                            {renderValue(slider)}
                        </span>
                    </div>
                </div>
            })
        }
    </div>
}