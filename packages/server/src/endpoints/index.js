module.exports = [
    {
        route: "/regenerate",
        method: "POST",
        middleware: ["ensureAuthenticated", "useJwtStrategy"],
        fn: "SessionController.regenerate"
    },
    {
        route: "/role",
        method: 'PUT',
        middleware: ["ensureAuthenticated", "roles"],
        fn: "UserController.grantRole"
    },
    {
        route: "/role",
        method: 'DELETE',
        middleware: ["ensureAuthenticated", "roles"],
        fn: "UserController.denyRole"
    },
    {
        route: "/roles",
        method: "GET",
        fn: "RolesController.get",
    },
    {
        route: "/session",
        method: 'DELETE',
        middleware: "ensureAuthenticated",
        fn: "SessionController.delete",
    },
    {
        route: "/sessions",
        method: 'DELETE',
        middleware: "ensureAuthenticated",
        fn: "SessionController.deleteAll",
    },
    {
        route: "/validate_session",
        method: "POST",
        middleware: "useJwtStrategy",
        fn: "SessionController.validate",
    },
    {
        route: "/sessions",
        method: "GET",
        middleware: "ensureAuthenticated",
        fn: "SessionController.get",
    },
    {
        route: "/has_permissions",
        method: "POST",
        middleware: [
            "ensureAuthenticated",
            "hasPermissions"
        ]
    },
    {
        route: "/self",
        method: "GET",
        middleware: "ensureAuthenticated",
        fn: "UserController.getSelf",
    },
    {
        route: "/users",
        method: "GET",
        middleware: "ensureAuthenticated",
        fn: "UserController.get",
    },
    {
        route: "/user",
        method: "GET",
        middleware: "ensureAuthenticated",
        fn: "UserController.getOne",
    },
    {
        route: "/self_user",
        method: "PUT",
        middleware: "ensureAuthenticated",
        fn: "UserController.updateSelf",
    },
    {
        route: "/user",
        method: "PUT",
        middleware: ["ensureAuthenticated", "privileged"],
        fn: "UserController.update",
    },
    {
        route: "/login",
        method: "POST",
        fn: "UserController.login",
    },
    {
        route: "/logout",
        method: "POST",
        middleware: ["ensureAuthenticated"],
        fn: "UserController.logout",
    },
    {
        route: "/register",
        method: "POST",
        fn: "UserController.register",
    },
    {
        route: "/is_auth",
        method: "POST",
        middleware: "ensureAuthenticated",
        fn: "UserController.isAuth",
    }
]