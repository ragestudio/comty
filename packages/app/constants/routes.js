export default [
    {
        path: "/auth",
        useLayout: "minimal",
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
        path: "/play/*",
        public: true,
        centeredContent: {
            mobile: true,
            desktop: true,
        },
        mobileTopBarSpacer: true,
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
        path: "/settings",
        useLayout: "default",
        centeredContent: {
            mobile: true,
            desktop: false,
        },
        mobileTopBarSpacer: true,
    },
    {
        path: "/security/*",
        useLayout: "default",
        centeredContent: true,
    },
    {
        path: "/music/*",
        useLayout: "default",
        centeredContent: true,
    },
    {
        path: "/landing/*",
        useLayout: "minimal",
        public: true,
    },
    {
        path: "/nfc/*",
        useLayout: "minimal",
        public: true,
    },
    {
        path: "/privacy/*",
        useLayout: "default",
        public: true
    },
    {
        path: "/terms/*",
        useLayout: "default",
        public: true
    },
    // THIS MUST BE THE LAST ROUTE
    {
        path: "/",
        useLayout: "default",
        centeredContent: {
            mobile: false,
            desktop: true,
        },
    },
]