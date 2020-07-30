import * as Icons from 'components/Icons'

let MenuList = [
    {
        id: 'main',
        title: 'Main',
        path: '/main',
        require: 'login',
        icon: <Icons.Home />,
        mobile: true,
        desktop: false
    },
    {
        id: 'explore',
        title: 'Explore',
        path: '/explore',
        require: 'login',
        icon: <Icons.Compass />,
        mobile: true,
        desktop: true
    },
    {
        id: 'saves',
        title: 'Saves',
        path: '/saves',
        require: 'login',
        icon: <Icons.Bookmark />,
        mobile: false,
        desktop: true
    },
    {
        id: 'messages',
        title: 'Messages',
        path: '/messages',
        require: 'login',
        icon: <Icons.MessageSquare />,
        mobile: true,
        desktop: true
    },
    {
        id: 'notifications',
        title: 'Notifications',
        path: '/notifications',
        require: 'login',
        icon: <Icons.Inbox/>,
        mobile: true,
        desktop: true
    },
]

export default MenuList