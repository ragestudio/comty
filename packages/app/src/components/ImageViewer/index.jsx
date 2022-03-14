import React from "react"
import { Swiper } from "antd-mobile"
import { LazyLoadImage } from "react-lazy-load-image-component"
import classnames from "classnames"

import "react-lazy-load-image-component/src/effects/blur.css"
import "./index.less"

const ImageViewer = (props) => {
    React.useEffect(() => {
        if (!Array.isArray(props.src)) {
            props.src = [props.src]
        }
    }, [])

    const openViewer = () => {
        if (props.extended) {
            return false
        }

        window.app.DrawerController.open("ImageViewer", ImageViewer, {
            componentProps: {
                src: props.src,
                extended: true
            }
        })
    }

    return <div className={classnames("ImageViewer", { ["extended"]: props.extended })}>
        <Swiper>
            {props.src.map((image) => {
                return <Swiper.Item
                    onClick={() => {
                        openViewer(image)
                    }}
                >
                    <LazyLoadImage
                        src={image}
                        effect="blur"
                        wrapperClassName="image-wrapper"
                        onClick={() => {
                            openViewer()
                        }}
                        onError={(e) => {
                            e.target.src = "/broken-image.svg"
                        }}
                    />
                </Swiper.Item>
            })}
        </Swiper>
    </div>
}

export default ImageViewer