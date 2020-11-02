import { Home, Compass, Bookmark, MessageSquare, Box, Package, Tv, Tool, Settings, LogIn, LogOut } from 'components/Icons'

/**
 * Sidebar Menu scheme
 *
 * @param id {string} Used for ( key_filter ) & ( router.push(id) ) [required]
 * @param icon {any} Render an "icon" component on the list | Default => null
 * @param title {string} Render an string on the list | Default => null
 * @param attributes.path {string} Override path for router.push(id)
 * @param attributes.position {string} Sets render position (Only for desktop mode) | Default => "top"
 * @param attributes.require {string} Sets an render condition | Default => null
 * @param attributes.desktop {boolean} Activate render for desktop clients | Default => true 
 * @param attributes.mobile {boolean} Activate render for mobile clients | Default => true
 */

export default [
    {
        id: 'main',
        icon: "Home",
        title: 'Main',
        attributes: {
            require: 'login',
            desktop: false,
        }
    },
    {
        id: 'explore',
        title: 'Explore',
        icon: "Compass",
    },
    {
        id: 'saves',
        title: 'Saves',
        icon: "Bookmark",
        attributes: {
            require: 'login',
            mobile: false
        }
    },
    {
        id: 'messages',
        title: 'Messages',
        icon: "MessageSquare",
        attributes: {
            require: 'login'
        }
    },
    {
        id: 'rooms',
        title: 'Rooms',       
        icon: "Box",
        attributes: {
            require: 'login'
        }
    },
    {
        id: 'workshop',
        title: 'Workshop',       
        icon: "Package",
        attributes: {
            require: 'login'
        }
    },
    {
        id: 'streams',
        title: 'Streams',       
        icon: "Tv",
        attributes: {
            require: 'login'
        }
    },
    {
        id: 'debug',
        title: 'Debug',
        icon: "Tool",
        attributes: {
            position: "bottom",
            require: "dev"
        }
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: "Settings",
        attributes: {
            position: "bottom"
        }
    },
    {
        id: 'logout',
        title: 'Logout',
        icon: "LogOut",
        attributes: {
            position: "bottom",
            require: 'login'
        }
    },
    {
        id: 'login',
        title: 'Signin',
        icon: "LogIn",
        attributes: {
            position: "bottom",
            require: "guest"
        }
    }
]



