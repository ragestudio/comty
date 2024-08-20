import React from "react"
import Modal from "./modal"

import useLayoutInterface from "@hooks/useLayoutInterface"

export default () => {
    function open(
        id,
        render,
        {
            framed = true,

            confirmOnOutsideClick = false,
            confirmOnClickTitle,
            confirmOnClickContent,

            className,
            props,
        } = {}
    ) {
        app.cores.window_mng.render(id, <Modal
            onClose={() => {
                app.cores.window_mng.close(id)
            }}
            framed={framed}
            className={className}
            confirmOnOutsideClick={confirmOnOutsideClick}
            confirmOnClickTitle={confirmOnClickTitle}
            confirmOnClickContent={confirmOnClickContent}
        >
            {
                React.createElement(render, props)
            }
        </Modal>)
    }

    function close(id) {
        app.cores.window_mng.close(id)
    }

    useLayoutInterface("modal", {
        open: open,
        close: close,
    })

    return null
}