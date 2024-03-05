import React from "react"
import * as antd from "antd"

import "./index.less"

export default (props) => {
    return <div className="player-volume_slider">
        <antd.Slider
            min={0}
            max={1}
            step={0.01}
            value={props.volume}
            onAfterChange={props.onChange}
            defaultValue={props.defaultValue}
            tooltip={{
                formatter: (value) => {
                    return `${Math.round(value * 100)}%`
                }
            }}
            vertical
        />
    </div>
}
