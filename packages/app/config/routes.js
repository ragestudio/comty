export default [
    {
        path: "/auth",
        useLayout: "minimal",
        public: true
    },
    {
        path: "/post/*",
        useLayout: "default",
        public: true
    },
    {
        path: "/tv/live/*",
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
        path: "/music/*",
        useLayout: "default",
        centeredContent: true,
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
    {
        path: "/apr/*",
        useLayout: "minimal",
        public: true
    },
    {
        path: "/marketplace/*",
        useLayout: "default",
        centeredContent: true,
        extendedContent: true,
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