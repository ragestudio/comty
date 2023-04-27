import React from "react"
import Slider from "@mui/material/Slider"

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

    React.useEffect(() => {
        setValues(props.ctx.currentValue)
    }, [props.ctx.currentValue])

    return <div
        className={
            props.disabled
                ? "compressorValues disabled"
                : "compressorValues"
        }
    >
        <div id="threshold" className="compressorValues_slider">
            <div className="compressorValues_slider_header">
                <span>
                    Threshold
                </span>
            </div>
            <Slider
                onChangeCommitted={(e, value) => handleChangeCommitted("threshold", value)}
                onChange={(e, value) => handleOnChange("threshold", value)}
                value={values.threshold}
                orientation="vertical"
                aria-label="Threshold"
                valueLabelDisplay="auto"
                step={0.1}
                min={-100}
                max={0}
                disabled={props.disabled}
            />

            <div className="compresorValues_slider_value">
                <span>
                    {values.threshold} dB
                </span>
            </div>
        </div>
        <div id="knee" className="compressorValues_slider">
            <div className="compressorValues_slider_header">
                <span>
                    Knee
                </span>
            </div>

            <Slider
                onChangeCommitted={(e, value) => handleChangeCommitted("knee", value)}
                onChange={(e, value) => handleOnChange("knee", value)}
                value={values.knee}
                orientation="vertical"
                aria-label="Knee"
                valueLabelDisplay="auto"
                step={0.1}
                min={0}
                max={40}
                disabled={props.disabled}
            />

            <div className="compresorValues_slider_value">
                <span>
                    {values.knee} dB
                </span>
            </div>
        </div>
        <div id="ratio" className="compressorValues_slider">
            <div className="compressorValues_slider_header">
                <span>
                    Ratio
                </span>
            </div>

            <Slider
                onChangeCommitted={(e, value) => handleChangeCommitted("ratio", value)}
                onChange={(e, value) => handleOnChange("ratio", value)}
                value={values.ratio}
                orientation="vertical"
                aria-label="Ratio"
                valueLabelDisplay="auto"
                step={0.1}
                min={1}
                max={20}
                disabled={props.disabled}
            />
            <div className="compresorValues_slider_value">
                <span>
                    {values.ratio} : 1
                </span>
            </div>
        </div>
        <div id="attack" className="compressorValues_slider">
            <div className="compressorValues_slider_header">
                <span>
                    Attack
                </span>
            </div>

            <Slider
                onChangeCommitted={(e, value) => handleChangeCommitted("attack", value)}
                onChange={(e, value) => handleOnChange("attack", value)}
                value={values.attack}
                orientation="vertical"
                aria-label="Attack"
                valueLabelDisplay="auto"
                step={0.1}
                min={0}
                max={1}
                disabled={props.disabled}
            />

            <div className="compresorValues_slider_value">
                <span>
                    {values.attack} s
                </span>
            </div>
        </div>
        <div id="release" className="compressorValues_slider">
            <div className="compressorValues_slider_header">
                <span>
                    Release
                </span>
            </div>

            <Slider
                onChangeCommitted={(e, value) => handleChangeCommitted("release", value)}
                onChange={(e, value) => handleOnChange("release", value)}
                value={values.release}
                orientation="vertical"
                aria-label="Release"
                valueLabelDisplay="auto"
                step={0.1}
                min={0}
                max={1}
                disabled={props.disabled}
            />
            <div className="compresorValues_slider_value">
                <span>
                    {values.release} s
                </span>
            </div>
        </div>
    </div>
}