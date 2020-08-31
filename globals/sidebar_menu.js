import * as Icons from 'components/Icons'

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
        icon: <Icons.Home />,
        title: 'Main',
        attributes: {
            require: 'login',
            desktop: false,
        }
    },
    {
        id: 'explore',
        title: 'Explore',
        icon: <Icons.Compass />,
    },
    {
        id: 'saves',
        title: 'Saves',
        icon: <Icons.Bookmark />,
        attributes: {
            require: 'login',
            mobile: false
        }
    },
    {
        id: 'messages',
        title: 'Messages',
        icon: <Icons.MessageSquare />,
        attributes: {
            require: 'login'
        }
    },
    {
        id: 'notifications',
        title: 'Notifications',       
        icon: <Icons.Inbox/>,
        attributes: {
            require: 'login'
        }
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: <Icons.Settings />,
        attributes: {
            position: "bottom"
        }
    },
    {
        id: 'logout',
        title: 'Logout',
        icon: <Icons.LogOut style={{ color: 'red', marginRight: '10px' }} />,
        attributes: {
            position: "bottom",
            require: 'login'
        }
    },
    {
        id: 'login',
        title: 'Signin',
        icon: <Icons.LogIn style={{ color: 'blue', marginRight: '10px' }} />,
        attributes: {
            position: "bottom",
            require: "guest"
        }
    }
]



