import React from 'react'
import classnames from 'classnames'
import withConnector from 'core/libs/withConnector'
import { __legacy__objectToArray } from '@ragestudio/nodecore-utils'

import InvalidComponent from './components/invalid'
import ProfileCard from './components/profileCard'
import SearchBar from './components/searchBar'

const MapToComponent = {
    profileCard: <ProfileCard />,
    searchBar: <SearchBar />
}

// to do: add order by numeric range
let DefaultElements = [
    "searchBar",
    "profileCard"
]

@withConnector
export default class RightSider extends React.Component {

    state = {
        fragments: []
    }

    renderElements() {
        try {
            return this.state.fragments.map((element) => {
                return <div key={element.id}>
                    {element.fragment ?? null}
                </div>
            })
        } catch (error) {
            console.log(error)
            return <InvalidComponent />
        }
    }

    componentDidMount() {
        if (typeof (window.rightSidebar) == "undefined") {
            window.RightSider = {}
        }
        window.RightSider.addFragment = (fragment) => {
            let updated = this.state.fragments
            updated.push(fragment)
            this.setState({ fragments: updated })
        }

        DefaultElements.forEach((e) => {
            window.RightSider.addFragment({ id: e, fragment: MapToComponent[e] })
        })

    }

    render() {
        return (
            <div
                id="right_sidebar"
                className={classnames(window.classToStyle("right_sidebar_wrapper"), {["swapped"]: this.props.app.overlayActive ?? false})}
            >
                <div className={window.classToStyle("right_sidebar_content")}>
                    {this.renderElements()}
                </div>
            </div>
        )
    }
}