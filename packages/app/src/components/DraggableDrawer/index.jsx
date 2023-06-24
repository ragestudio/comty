// © Jack Hanford https://github.com/hanford/react-drag-drawer
import React, { Component } from "react"
import { Motion, spring, presets } from "react-motion"
import PropTypes from "prop-types"
import document from "global/document"
import Observer from "react-intersection-observer"
import { css } from "@emotion/css"
import { createPortal } from "react-dom"

export default class DraggableDrawer extends Component {
    static propTypes = {
        open: PropTypes.bool.isRequired,
        children: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.array,
            PropTypes.element
        ]),
        onRequestClose: PropTypes.func,
        onDrag: PropTypes.func,
        onOpen: PropTypes.func,
        inViewportChange: PropTypes.func,
        allowClose: PropTypes.bool,
        notifyWillClose: PropTypes.func,
        modalElementClass: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.string
        ]),
        containerOpacity: PropTypes.number,
        getContainerRef: PropTypes.func,
        getModalRef: PropTypes.func
    }

    static defaultProps = {
        notifyWillClose: () => { },
        onOpen: () => { },
        onDrag: () => { },
        inViewportChange: () => { },
        onRequestClose: () => { },
        getContainerRef: () => { },
        getModalRef: () => { },
        containerOpacity: 0.6,
        parentElement: document.body,
        allowClose: true,
        dontApplyListeners: false,
        modalElementClass: ""
    }

    state = {
        ignore: false,
        onRange: false,
        open: this.props.open,
        thumb: 0,
        start: 0,
        position: 0,
        touching: false,
        listenersAttached: false
    }

    DESKTOP_MODE = false
    ALLOW_DRAWER_TRANSFORM = true

    MAX_NEGATIVE_SCROLL = -50
    PX_TO_CLOSE_FROM_BOTTOM = 200

    componentDidMount() {
        this.DESKTOP_MODE = !app.isMobile
    }

    componentWillUnmount() {
        this.removeListeners()
    }

    componentDidUpdate(prevProps, nextState) {
        // in the process of closing the drawer
        if (!this.props.open && prevProps.open) {
            this.removeListeners()

            setTimeout(this.setState({ open: false }), 300)
        }

        if (this.drawer) {
            this.setNegativeScroll(this.drawer)
        }

        // in the process of opening the drawer
        if (this.props.open && !prevProps.open) {
            this.props.onOpen()

            this.setState({ open: true })
        }
    }

    attachListeners = (drawer) => {
        const { dontApplyListeners, getModalRef } = this.props
        const { listenersAttached } = this.state

        // only attach listeners once as this function gets called every re-render
        if (!drawer || listenersAttached || dontApplyListeners) return

        this.drawer = drawer

        getModalRef(drawer)

        this.drawer.addEventListener("touchend", this.release)
        this.drawer.addEventListener("touchmove", this.drag)
        this.drawer.addEventListener("touchstart", this.tap)

        let position = 0

        this.setState({ listenersAttached: true, position }, () => {
            setTimeout(() => {
                // trigger reflow so webkit browsers calculate height properly 😔
                // https://bugs.webkit.org/show_bug.cgi?id=184905
                this.drawer.style.display = "none"
                void this.drawer.offsetHeight
                this.drawer.style.display = ""
            }, 300)
        })
    }

    isThumbInDraggerRange = (event) => {
        return (event.touches[0].clientY - this.drawer.getBoundingClientRect().top)
    }

    removeListeners = () => {
        if (!this.drawer) {
            return false
        }

        this.drawer.removeEventListener("touchend", this.release)
        this.drawer.removeEventListener("touchmove", this.drag)
        this.drawer.removeEventListener("touchstart", this.tap)

        this.setState({ listenersAttached: false })
    }

    tap = (event) => {
        const { pageY } = event.touches[0]

        if (!this.isThumbInDraggerRange(event)) {
            return false
        }

        // check if event.target has dragger argument
        const inDraggerArea = !!event.target.closest("#dragger-area")

        const start = pageY

        // reset NEW_POSITION and MOVING_POSITION
        this.NEW_POSITION = 0
        this.MOVING_POSITION = 0

        this.setState({
            ignore: !inDraggerArea,
            onRange: this.isThumbInDraggerRange(event),
            thumb: start,
            start: start,
            touching: true
        })
    }

    drag = (event) => {
        if (this.state.ignore) {
            return false
        }

        event.preventDefault()

        const { thumb, position } = this.state
        const { pageY } = event.touches[0]

        const movingPosition = pageY
        const delta = movingPosition - thumb
        const newPosition = position + delta

        if (this.ALLOW_DRAWER_TRANSFORM) {
            // allow to drag negative scroll
            if (newPosition < this.MAX_NEGATIVE_SCROLL) {
                return false
            }

            this.props.onDrag({ newPosition })

            this.MOVING_POSITION = movingPosition
            this.NEW_POSITION = newPosition

            if (this.shouldWeCloseDrawer()) {
                this.props.notifyWillClose(true)
            } else {
                this.props.notifyWillClose(false)
            }

            this.setState({
                thumb: movingPosition,
                position: newPosition,
            })
        }
    }

    release = () => {
        this.setState({ touching: false })

        if (this.shouldWeCloseDrawer() && this.state.onRange) {
            this.props.onRequestClose(this)
        } else {
            let newPosition = 0

            this.setState({ position: newPosition })
        }
    }

    setNegativeScroll = (element) => {
        const size = this.getElementSize()

        this.NEGATIVE_SCROLL = size - element.scrollHeight - this.MAX_NEGATIVE_SCROLL
    }

    hideDrawer = () => {
        const { allowClose } = this.props

        let defaultPosition = 0

        if (allowClose === false) {
            // if we aren't going to allow close, let's animate back to the default position
            return this.setState({
                position: defaultPosition,
                thumb: 0,
                touching: false
            })
        }

        this.setState({
            open: false,
            position: defaultPosition,
            touching: false
        })

        // cleanup
        this.removeListeners()
    }

    shouldWeCloseDrawer = () => {
        if (this.MOVING_POSITION === 0) {
            return false
        }

        const containerHeight = this.getElementSize()
        const closeThreshold = containerHeight - this.PX_TO_CLOSE_FROM_BOTTOM

        return (
            this.NEW_POSITION >= 0 &&
            this.MOVING_POSITION >= closeThreshold
        )
    }

    getDrawerTransform = (value) => {
        return { transform: `translate3d(0, ${value}px, 0)` }
    }

    getElementSize = () => {
        return window.innerHeight
    }

    getPosition() {
        const { position } = this.state

        return position
    }

    inViewportChange = (inView) => {
        this.props.inViewportChange(inView)

        this.ALLOW_DRAWER_TRANSFORM = inView
    }

    onClickOutside = (event) => {
        if (!this.props.allowClose) {
            return false
        }

        // check if is clicking outside main component
        if (this.drawer && event.target?.className) {
            if (event.target.className.includes("ant-cascader") || event.target.className.includes("ant-select")) {
                return false
            }

            if (!this.drawer.contains(event.target)) {
                this.props.onRequestClose(this)
            }
        }
    }

    preventDefault = (event) => event.preventDefault()
    stopPropagation = (event) => event.stopPropagation()

    render() {
        const {
            containerOpacity,
            id,
            getContainerRef,
        } = this.props

        const open = this.state.open && this.props.open

        const { touching } = this.state

        const springPreset = { damping: 20, stiffness: 300 }
        const animationSpring = touching ? springPreset : presets.stiff
        const hiddenPosition = this.getElementSize()
        const position = this.getPosition(hiddenPosition)

        let containerStyle = {
            backgroundColor: `rgba(55, 56, 56, ${open ? containerOpacity : 0})`
        }

        return createPortal(
            <Motion
                style={{
                    translate: spring(open ? position : hiddenPosition, animationSpring)
                }}
                defaultStyle={{
                    translate: hiddenPosition
                }}
            >
                {({ translate }) => {
                    return (
                        <div
                            id={id}
                            style={containerStyle}
                            onMouseDown={this.onClickOutside}
                            className="draggable-drawer"
                            ref={getContainerRef}
                        >
                            <Observer
                                className={HaveWeScrolled}
                                onChange={this.inViewportChange}
                            />

                            <div
                                className="draggable-drawer_body"
                                onClick={this.stopPropagation}
                                style={{
                                    ...this.props.bodyStyle,
                                    ...this.getDrawerTransform(translate),
                                }}
                                ref={this.attachListeners}
                            >
                                <div
                                    className="dragger-area"
                                    id="dragger-area"
                                    dragger
                                >
                                    <div
                                        className="dragger-indicator"
                                    />
                                </div>

                                {this.props.children}
                            </div>
                        </div>
                    )
                }}
            </Motion>,
            this.props.parentElement
        )
    }
}

const HaveWeScrolled = css`
  position: absolute;
  top: 0;
  height: 1px;
  width: 100%;
`