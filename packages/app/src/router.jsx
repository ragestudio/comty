import React from "react"
import { Switch, Route, BrowserRouter, withRouter } from "react-router-dom"

const NotFoundRender = () => {
    return <div>Not found</div>
}

const paths = {
    ...import.meta.glob("/src/debug/components/**/[a-z[]*.jsx"),
    ...import.meta.glob("/src/pages/**/[a-z[]*.jsx"),
    ...import.meta.glob("/src/pages/**/[a-z[]*.tsx"),
}

const pathsMobile = {
    ...import.meta.glob("/src/pages/**/[a-z[]*.mobile.jsx"),
    ...import.meta.glob("/src/pages/**/[a-z[]*.mobile.tsx"),
}

const routes = Object.keys(paths).map((route) => {
    const path = route
        .replace(/\/src\/pages|index|\.jsx$/g, "")
        .replace(/\/src\/pages|index|\.tsx$/g, "")
        .replace(/\/src\/debug\/components/g, "/debug")
        .replace(/\[\.{3}.+\]/, "*")
        .replace(/\[(.+)\]/, ":$1")

    return { path, component: React.lazy(paths[route]) }
})

const mobileComponents = Object.fromEntries(Object.keys(pathsMobile).map((route) => {
    const path = route
        .replace(/\/src\/pages|index|\.mobile|\.jsx$/g, "")
        .replace(/\/src\/pages|index|\.mobile|\.tsx$/g, "")
        .replace(/\/src\/debug\/components/g, "/debug")
        .replace(/\[\.{3}.+\]/, "*")
        .replace(/\[(.+)\]/, ":$1")

    return [path, React.lazy(pathsMobile[route])]
}))

export function BindContexts(component) {
    let contexts = {
        main: {},
        app: {},
    }

    if (typeof component.bindApp === "string") {
        if (component.bindApp === "all") {
            Object.keys(app).forEach((key) => {
                contexts.app[key] = app[key]
            })
        }
    } else {
        if (Array.isArray(component.bindApp)) {
            component.bindApp.forEach((key) => {
                contexts.app[key] = app[key]
            })
        }
    }

    if (typeof component.bindMain === "string") {
        if (component.bindMain === "all") {
            Object.keys(main).forEach((key) => {
                contexts.main[key] = main[key]
            })
        }
    } else {
        if (Array.isArray(component.bindMain)) {
            component.bindMain.forEach((key) => {
                contexts.main[key] = main[key]
            })
        }
    }

    return (props) => React.createElement(component, { ...props, contexts })
}

export const Router = withRouter((props) => {
    const defaultTransitionDelay = 150
    const forceUpdate = React.useReducer(() => ({}))[1]

    React.useEffect(() => {
        props.history.listen((event) => {
            if (typeof props.onTransitionFinish === "function") {
                props.onTransitionFinish(event)
            }

            window.app.eventBus.emit("router.transitionFinish", event)
        })

        props.history.setLocation = (to, state = {}, delay = 150) => {
            // clean double slashes
            to = to.replace(/\/{2,}/g, "/")

            // if state is a number, it's a delay
            if (typeof state !== "object") {
                delay = state
                state = {}
            }

            const lastLocation = props.history.lastLocation

            if (typeof lastLocation !== "undefined" && lastLocation?.pathname === to && lastLocation?.state === state) {
                return false
            }

            if (typeof props.onTransitionStart === "function") {
                props.onTransitionStart(delay)
            }

            window.app.eventBus.emit("router.transitionStart", delay)

            setTimeout(() => {
                props.history.push({
                    pathname: to,
                }, state)

                props.history.lastLocation = window.location
            }, delay ?? defaultTransitionDelay)
        }

        window.app.eventBus.on(`router.forceUpdate`, forceUpdate)

        props.history.lastLocation = window.location

        window.app.setLocation = props.history.setLocation
    }, [])

    const router = {
        history: props.history,
        lastLocation: props.history.lastLocation,
        forceUpdate,
    }

    // return children with router in props
    return React.cloneElement(props.children, { router })
})

export const InternalRouter = (props) => {
    return <BrowserRouter>
        <Router {...props} />
    </BrowserRouter>
}

export const PageRender = (props) => {
    return <React.Suspense fallback={props.staticRenders?.PageLoad ? React.createElement(props.staticRenders?.PageLoad) : "Loading..."}>
        <Switch>
            {routes.map(({ path, component: Component = React.Fragment }) => {
                if (window.isMobile) {
                    if (mobileComponents[path]) {
                        Component = mobileComponents[path]
                    } else {
                        console.warn(`No mobile component for ${path}, using default`)
                    }
                }

                const generateRenderComponent = (props) => {
                    return React.createElement(BindContexts(Component), {
                        ...props,
                        history: props.history,
                    })
                }

                return <Route
                    key={path}
                    path={path}
                    component={generateRenderComponent}
                    exact={true}
                />
            })}
            <Route path="*" component={props.staticRenders?.NotFound ?? NotFoundRender} />
        </Switch>
    </React.Suspense>
}

export default {
    routes,
    BindContexts,
    InternalRouter,
    PageRender,
}