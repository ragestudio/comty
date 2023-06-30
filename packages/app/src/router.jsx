import React from "react"
import { BrowserRouter, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { Skeleton, Button, Result } from "antd"
import config from "config"
import loadable from "@loadable/component"

import routesDeclaration from "schemas/routes"

const DefaultNotFoundRender = () => {
    return <div>Not found</div>
}

const DefaultLoadingRender = () => {
    return <Skeleton active />
}

const getPagePaths = () => {
    let paths = {
        ...import.meta.glob("/src/pages/**/[a-z[]*.jsx"),
        ...import.meta.glob("/src/pages/**/[a-z[]*.tsx"),
    }

    if (app.isMobile) {
        paths = {
            ...paths,
            ...import.meta.glob("/src/pages/**/[a-z[]*.mobile.jsx"),
            ...import.meta.glob("/src/pages/**/[a-z[]*.mobile.tsx"),
        }

        // find & replace matching non mobile routes with mobile routes
        Object.keys(paths).forEach((path) => {
            const mobilePath = path.replace(/\.jsx$/, ".mobile.jsx").replace(/\.tsx$/, ".mobile.tsx")

            if (paths[mobilePath]) {
                delete paths[path]
            }
        })
    }

    return paths
}

const generateRoutes = () => {
    let paths = getPagePaths()

    return Object.keys(paths).map((route) => {
        let path = route
        .replace(/\/src\/pages|index|\.jsx$/g, "")
        .replace(/\/src\/pages|index|\.tsx$/g, "")
        .replace(/\/src\/pages|index|\.mobile|\.jsx$/g, "")
        .replace(/\/src\/pages|index|\.mobile|\.tsx$/g, "")

        path = path.replace(/\[\.{3}.+\]/, "*").replace(/\[(.+)\]/, ":$1")

        return {
            path,
            element: paths[route],
        }
    })
}

function generatePageElementWrapper(route, element, bindProps) {
    return React.createElement((props) => {
        const params = useParams()
        const url = new URL(window.location)
        const query = new Proxy(url, {
            get: (target, prop) => target.searchParams.get(prop),
        })

        const routeDeclaration = routesDeclaration.find((layout) => {
            const routePath = layout.path.replace(/\*/g, ".*").replace(/!/g, "^")

            return new RegExp(routePath).test(route)
        }) ?? {
            path: route,
            useLayout: "default",
        }

        route = route.replace(/\?.+$/, "").replace(/\/{2,}/g, "/")
        route = route.replace(/\/$/, "")

        if (routeDeclaration) {
            if (!bindProps.user && (window.location.pathname !== config.app?.authPath)) {
                if (!routeDeclaration.public) {
                    if (typeof window.app.location.push === "function") {
                        window.app.location.push(config.app?.authPath ?? "/login")
                        return <div />
                    }

                    window.location.href = config.app?.authPath ?? "/login"

                    return <div />
                }
            }

            if (typeof routeDeclaration.requiredRoles !== "undefined") {
                const isAdmin = bindProps.user?.roles?.includes("admin") ?? false

                if (!isAdmin && !routeDeclaration.requiredRoles.some((role) => bindProps.user?.roles?.includes(role))) {
                    return <Result
                        status="403"
                        title="403"
                        subTitle="Sorry, you are not authorized to access this page."
                        extra={<Button type="primary" onClick={() => window.app.location.push("/")}>Back Home</Button>}
                    />
                }
            }

            if (routeDeclaration.useLayout) {
                app.layout.set(routeDeclaration.useLayout)
            }

            if (typeof routeDeclaration.useTitle !== "undefined") {
                if (typeof routeDeclaration.useTitle === "function") {
                    routeDeclaration.useTitle = routeDeclaration.useTitle(route, params)
                }

                document.title = `${routeDeclaration.useTitle} - ${config.app.siteName}`
            } else {
                document.title = config.app.siteName
            }

            if (routeDeclaration.centeredContent) {
                app.layout.toggleCenteredContent(true)
            } else {
                app.layout.toggleCenteredContent(false)
            }
        }

        return React.createElement(
            loadable(element, {
                fallback: React.createElement(bindProps.staticRenders?.PageLoad || DefaultLoadingRender),
            }),
            {
                ...props,
                ...bindProps,
                url: url,
                params: params,
                query: query,
            })
    })
}

const NavigationController = (props) => {
    if (!app.location) {
        app.location = Object()
    }

    const navigate = useNavigate()

    async function setLocation(to, state = {}) {
        // clean double slashes
        to = to.replace(/\/{2,}/g, "/")

        // if state is a number, it's a delay
        if (typeof state !== "object") {
            state = {}
        }

        const transitionDuration = app.cores.style.getValue("page-transition-duration") ?? "250ms"

        state.transitionDelay = Number(transitionDuration.replace("ms", ""))

        app.eventBus.emit("router.navigate", to, {
            state,
        })

        app.location.last = window.location

        if (state.transitionDelay >= 100) {
            await new Promise((resolve) => setTimeout(resolve, state.transitionDelay))
        }

        return navigate(to, {
            state
        })
    }

    async function backLocation() {
        const transitionDuration = app.cores.style.getValue("page-transition-duration") ?? "250ms"

        app.eventBus.emit("router.navigate")

        app.location.last = window.location

        if (transitionDuration >= 100) {
            await new Promise((resolve) => setTimeout(resolve, transitionDuration))
        }

        return window.history.back()
    }

    React.useEffect(() => {
        app.location = {
            last: window.location,
            push: setLocation,
            back: backLocation,
        }
    }, [])

    return props.children
}

export const InternalRouter = (props) => {
    return <BrowserRouter>
        <NavigationController>
            {
                props.children
            }
        </NavigationController>
    </BrowserRouter>
}

export const PageRender = React.memo((props) => {
    let routes = generateRoutes()

    console.log(routes)

    return <Routes>
        {
            routes.map((route, index) => {
                return <Route
                    key={index}
                    path={route.path}
                    element={generatePageElementWrapper(route.path, route.element, props)}
                    exact
                />
            })
        }
        <Route
            path="*"
            element={React.createElement(props.staticRenders?.NotFound || DefaultNotFoundRender)}
        />
    </Routes>
})