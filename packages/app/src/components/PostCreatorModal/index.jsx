import React from "react"
import classnames from "classnames"

import PostCreator from "components/PostCreator"

import "./index.less"

export default (props) => {
    const [visible, setVisible] = React.useState(false)

    let escTimeout = null

    const close = () => {
        setVisible(false)

        setTimeout(() => {
            if (typeof props.onClose === "function") {
                props.onClose()
            }
        }, 150)
    }

    const handleEsc = (e) => {
        if (e.key === "Escape") {
            if (escTimeout !== null) {
                clearTimeout(escTimeout)
                return close()
            }

            escTimeout = setTimeout(() => {
                escTimeout = null
            }, 250)
        }
    }

    const handleClickOutside = (e) => {
        if (e.target === e.currentTarget) {
            close()
        }
    }

    React.useEffect(() => {
        setTimeout(() => {
            setVisible(true)
        }, 10)

        document.addEventListener("keydown", handleEsc, false)

        return () => {
            document.removeEventListener("keydown", handleEsc, false)
        }
    }, [])

    return <div
        className={classnames(
            "post_creator_modal",
            {
                ["active"]: visible
            }
        )}
        onClick={handleClickOutside}
    >
        <PostCreator
            onPost={close}
        />
    </div>
}