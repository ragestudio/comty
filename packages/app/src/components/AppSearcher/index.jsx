import React from "react"
import * as antd from "antd"
import "./index.less"

class Results extends React.Component {
    state = {
        results: this.props.results ?? []
    }

    renderResults = () => {
        return this.state.results.map(result => {
            return <div id={result.id}>
                {result.title}
            </div>
        })
    }

    render() {
        return <div>
            {this.renderResults()}
        </div>
    }
}

export default class AppSearcher extends React.Component {
	state = {
		loading: false,
		searchResult: null,
	}

    handleSearch = (value) => {
        let results = []

        // get results
        results.push({ id: value, title: value })

        // storage results
        this.setState({ searchResult: results })

        // open results onlayout drawer
        this.openResults()
    }

    openResults = () => {
		window.app.SidedrawerController.render(() => <Results results={this.state.searchResult} />)
	}

	render() {
		return (
			<div>
				<antd.Input.Search
					style={{ width: this.props.width }}
					className="search_bar"
					placeholder="Search on app..."
					loading={this.state.loading}
                    onSearch={this.handleSearch}
				/>
			</div>
		)
	}
}
