import { Extension } from "evite"
import React from "react"
import { Window } from "components"
import { Skeleton, Tabs } from "antd"

class DebuggerUI extends React.Component {
    state = {
        loading: true,
        error: null,
        debuggers: null,
        active: null,
    }

    toogleLoading = (to = !this.state.loading ?? false) => {
        this.setState({ loading: to })
    }

    loadDebuggers = async () => {
        this.toogleLoading(true)

        const debuggers = await import(`~/debugComponents`)
        let renders = {}

        Object.keys(debuggers).forEach((key) => {
            renders[key] = debuggers[key]
        })

        this.setState({ debuggers: renders }, () => {
            this.toogleLoading(false)
        })
    }

    componentDidMount = async () => {
        await this.loadDebuggers()
    }

    componentDidCatch = (error, info) => {
        this.setState({ error })
    }

    onChangeTab = (key) => {
        console.debug(`Changing tab to ${key}`)
        this.setState({ active: key, error: null })
    }

    renderError = (key, error) => {
        return (
            <div>
                <h2>Debugger Error</h2>
                <i>
                    <h4>
                        Catch on [<strong>{key}</strong>]
                    </h4>
                </i>
                `<code>{error.message}</code>`
                <hr />
                <code>{error.stack}</code>
            </div>
        )
    }

    renderTabs = () => {
        return Object.keys(this.state.debuggers).map((key) => {
            return <Tabs.TabPane tab={key} key={key} />
        })
    }

    renderDebugger = (_debugger) => {
        try {
            return React.createElement(window.app.bindContexts(_debugger))
        } catch (error) {
            return this.renderError(key, error)
        }
    }

    render() {
        const { loading, error } = this.state

        if (loading) {
            return <Skeleton active />
        }

        return (
            <div>
                <Tabs
                    onChange={this.onChangeTab}
                    activeKey={this.state.active}
                >
                    {this.renderTabs()}
                </Tabs>
                {error && this.renderError(this.state.active, error)}
                {!this.state.active ? (
                    <div> Select an debugger to start </div>
                ) : (
                    this.renderDebugger(this.state.debuggers[this.state.active])
                )}
            </div>
        )
    }
}

class Debugger {
    constructor(mainContext, params = {}) {
        this.mainContext = mainContext
        this.params = { ...params }

        this.bindings = {}
    }

    openWindow = () => {
        new Window.DOMWindow({ id: "debugger", children: window.app.bindContexts(DebuggerUI) }).create()
    }

    bind = (id, binding) => {
        this.bindings[id] = binding

        return binding
    }

    unbind = (id) => {
        delete this.bindings[id]
    }
}

export default class VisualDebugger extends Extension {
    window = {
        debug: new Debugger(this.mainContext)
    }
}