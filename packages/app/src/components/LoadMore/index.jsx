import React from "react"
import PropTypes from "prop-types"
import classnames from "classnames"
import IntersectionObserver from "intersection-observer-polyfill"

import "./index.less"

export default class LoadMore extends React.Component {
    constructor() {
        super(...arguments)
        this.insideViewportCb = this.insideViewportCb.bind(this)
    }

    static propTypes = {
        onBottom: PropTypes.func,
        fetching: PropTypes.bool,
        hasMore: PropTypes.bool,
        NoResult: PropTypes.func,
        Footer: PropTypes.func
    }

    componentDidMount() {
        try {
            const node = document.getElementById("bottom")

            this.observer = new IntersectionObserver(this.insideViewportCb)
            this.observer.observe(node)
        } catch (err) {
            console.log("err in finding node", err)
        }

        window.addEventListener("scroll", this.handleOnScroll)
    }

    insideViewportCb(entries) {
        const { fetching, onBottom } = this.props

        entries.forEach(element => {
            if (element.intersectionRatio > 0 && !fetching) {
                onBottom()
            }
        })
    }

    componentWillUnmount() {
        if (this.observer) {
            this.observer = null
        }
    }

    render() {
        const {
            className,
            children,
            hasMore,
            loadingComponent,
            noResultComponent,
        } = this.props

        return <div className="infinite-scroll">
            <div className={classnames(className)}>
                {children}
            </div>

            <div style={{ clear: "both" }} />

            <div
                id="bottom"
                style={{ display: hasMore ? "block" : "none" }}
            >
                {loadingComponent && React.createElement(loadingComponent)}
            </div>

            <div
                className="no-result"
                style={{ display: hasMore ? "none" : "block" }}
            >
                {noResultComponent ? React.createElement(noResultComponent) : "No more result"}
            </div>
        </div>
    }
}