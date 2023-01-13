import React from "react"
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom"
import { Skeleton } from "antd"
import loadable from "@loadable/component"

const NotFoundRender = () => {
    return <div>Not found</div>
}

const LoadingRender = () => {
    return <Skeleton active />
}

const paths = {
    ...import.meta.glob("/src/pages/**/[a-z[]*.jsx"),
    ...import.meta.glob("/src/pages/**/[a-z[]*.tsx"),
}

const pathsMobile = {
    ...import.meta.glob("/src/pages/**/[a-z[]*.mobile.jsx"),
    ...import.meta.glob("/src/pages/**/[a-z[]*.mobile.tsx"),
}

function generateElementWrapper(route, element, bindProps) {
    return React.createElement((props) => {
        const params = useParams()

        return React.createElement(
            loadable(element, {
                fallback: React.createElement(LoadingRender),
            }),
            {
                ...props,
                ...bindProps,
                params: params,
            })
    })
}

const routes = Object.keys(paths).map((route) => {
    const path = route
        .replace(/\/src\/pages|index|\.jsx$/g, "")
        .replace(/\/src\/pages|index|\.tsx$/g, "")
        .replace(/\[\.{3}.+\]/, "*")
        .replace(/\[(.+)\]/, ":$1")

    return {
        path,
        element: paths[route]
    }
})

const mobileRoutes = Object.keys(pathsMobile).map((route) => {
    const path = route
        .replace(/\/src\/pages|index|\.mobile|\.jsx$/g, "")
        .replace(/\/src\/pages|index|\.mobile|\.tsx$/g, "")
        .replace(/\[\.{3}.+\]/, "*")
        .replace(/\[(.+)\]/, ":$1")

    return {
        path,
        element: pathsMobile[path]
    }
})

export const PageRender = React.memo((props) => {
    const navigate = useNavigate()
    app.location = useLocation()

    React.useEffect(() => {
        app.setLocation = async (to, state = {}) => {
            // clean double slashes
            to = to.replace(/\/{2,}/g, "/")

            // if state is a number, it's a delay
            if (typeof state !== "object") {
                state = {}
            }

            state.transitionDelay = Number((app.style.getValue("page-transition-duration") ?? "250ms").replace("ms", ""))

            app.eventBus.emit("router.navigate", to, {
                state,
            })

            if (state.transitionDelay >= 100) {
                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve()
                    }, state.transitionDelay)
                })
            }

            return navigate(to, {
                state
            })
        }
    }, [])

    return <Routes>
        {
            routes.map((route, index) => {
                let Element = route.element

                if (window.isMobile) {
                    const mobileElement = mobileRoutes.find((r) => r.path === route.path)

                    if (mobileElement) {
                        Element = mobileElement
                    }
                }

                return <Route
                    key={index}
                    path={route.path}
                    element={generateElementWrapper(route.path, route.element, props)}
                    exact
                />
            })
        }
        <Route path="*" element={React.createElement(props.staticRenders?.NotFound) ?? <NotFoundRender />} />
    </Routes>
})