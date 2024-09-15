import React from "react"
import { BrowserRouter, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { Skeleton } from "antd"
import config from "@config"
import loadable from "@loadable/component"

import routesDeclaration from "@config/routes"

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

        path = path.replace(/\[([a-z]+)\]/g, ":$1")
        path = path.replace(/\[\.{3}.+\]/, "*").replace(/\[(.+)\]/, ":$1")

        return {
            path,
            element: paths[route],
        }
    })
}

function findRouteDeclaration(route) {
    return routesDeclaration.find((layout) => {
        const routePath = layout.path.replace(/\*/g, ".*").replace(/!/g, "^")

        return new RegExp(routePath).test(route)
    }) ?? {
        path: route,
        useLayout: "default",
    }
}

function isAuthenticated() {
    return !!app.userData
}

function handleRouteDeclaration(declaration) {
    React.useEffect(() => {
        if (declaration) {
            // if not authenticated and is not in public route, redirect
            if (!isAuthenticated() && !declaration.public && (window.location.pathname !== config.app?.authPath)) {
                if (typeof window.app.location.push === "function") {
                    window.app.location.push(config.app?.authPath ?? "/login")

                    app.cores.notifications.new({
                        title: "Please login to use this feature.",
                        duration: 15,
                    })
                } else {
                    window.location.href = config.app?.authPath ?? "/login"
                }
            } else {
                if (declaration.useLayout) {
                    app.layout.set(declaration.useLayout)
                }

                if (typeof declaration.centeredContent !== "undefined") {
                    let finalBool = null

                    if (typeof declaration.centeredContent === "boolean") {
                        finalBool = declaration.centeredContent
                    } else {
                        if (app.isMobile) {
                            finalBool = declaration.centeredContent?.mobile ?? null
                        } else {
                            finalBool = declaration.centeredContent?.desktop ?? null
                        }
                    }

                    app.layout.toggleCenteredContent(finalBool)
                }

                if (typeof declaration.useTitle !== "undefined") {
                    if (typeof declaration.useTitle === "function") {
                        declaration.useTitle = declaration.useTitle(path, params)
                    }

                    document.title = `${declaration.useTitle} - ${config.app.siteName}`
                } else {
                    document.title = config.app.siteName
                }
            }
        }
    }, [])
}

function generatePageElementWrapper(path, element, props, declaration) {
    return React.createElement((props) => {
        const params = useParams()
        const url = new URL(window.location)
        const query = new Proxy(url, {
            get: (target, prop) => target.searchParams.get(prop),
        })

        handleRouteDeclaration(declaration)

        return React.createElement(
            loadable(element, {
                fallback: React.createElement(props.staticRenders?.PageLoad || DefaultLoadingRender),
            }),
            {
                ...props,
                ...props,
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

        app.location.last = window.location

        await navigate(to, {
            state
        })

        app.eventBus.emit("router.navigate", to, {
            state,
        })

        return {
            to,
            state,
        }
    }

    async function backLocation() {
        return window.history.back()
    }

    async function onHistoryChange() {
        setTimeout(() => {
            app.eventBus.emit("router.navigate", window.location.pathname, {
                state: window.location.state,
            })
        }, 0)
    }

    React.useEffect(() => {
        app.location = {
            last: window.location,
            push: setLocation,
            back: backLocation,
        }

        window.addEventListener("popstate", onHistoryChange)

        return () => {
            window.removeEventListener("popstate", onHistoryChange)
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

    return <Routes>
        {
            routes.map((route, index) => {
                const declaration = findRouteDeclaration(route.path)

                return <Route
                    key={index}
                    path={route.path}
                    element={generatePageElementWrapper(route.path, route.element, props, declaration)}
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