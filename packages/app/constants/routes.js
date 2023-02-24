export default [
    {
        path: "/login",
        useLayout: "login",
        public: true
    },
    {
        path: "/home/*",
        useLayout: "default",
        useTitle: "Home",
    },
    {
        path: "/posts/*",
        useLayout: "default",
        useTitle: "Posts",
    },
    {
        path: "/post/*",
        useLayout: "default",
        public: true
    },
    {
        path: "/live/*",
        useLayout: "default",
        public: true
    },
    {
        path: "/featured-event/*",
        useLayout: "default",
        public: true
    },
    {
        path: "/settings/*",
        useLayout: "default",
        centeredContent: true
    },
    {
        path: "/security/*",
        useLayout: "default",
        centeredContent: true
    },
    {
        path: "/music/creator",
        useLayout: "default",
        centeredContent: true
    }
]