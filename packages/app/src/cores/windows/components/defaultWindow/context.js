import React from "react"

export default React.createContext({
    title: null,
    close: () => { },
    updatePosition: () => { },
    updateDimensions: () => { },
    updateTitle: () => { },
    position: {
        x: 0,
        y: 0,
    },
    dimensions: {
        width: 0,
        height: 0,
    },
})