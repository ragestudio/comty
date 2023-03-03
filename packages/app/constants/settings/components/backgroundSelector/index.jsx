import React from "react"
import SVG from "react-inlinesvg"

import "./index.less"

const defaultBackgrounds = [
    {
        id: "topography",
        label: "Topography",
        src: "/assets/default_bg/topography.svg"
    },
    {
        id: "meteors",
        label: "Meteors",
        src: "/assets/default_bg/meteors.svg"
    },
    {
        id: "dots",
        label: "Dots",
        src: "/assets/default_bg/dots.svg"
    },
    {
        id: "hideout",
        label: "Hideout",
        src: "/assets/default_bg/hideout.svg"
    }
]

export default (props) => {
    return <div className="background_selector">
        <div className="background_selector_defaults">
            {
                defaultBackgrounds.map((background) => {
                    return <div className="background_selector_defaults__item">
                        <div className="background_selector_defaults__item_name">
                            <h3>{background.label}</h3>
                        </div>

                        <div
                            className="background_selector_defaults__item_preview"
                            onClick={() => {
                                app.cores.style.modify({
                                    backgroundSVG: `url("${background.src}")`
                                })
                            }}
                            style={{
                                maskImage: `url("${background.src}")`,
                                WebkitMaskImage: `url("${background.src}")`
                            }}
                        />

                    </div>
                })
            }
        </div>
    </div>
}