// @alias from 'components'

// Helpers & Misc
export * as Icons from './Icons'
import Loader from './Loader/Loader.js'
import App_about from './App_about'
import * as Feather from 'feather-reactjs'

// App Layout Components
import * as MyLayout from './Layout/index.js'
import HeaderSearch from './HeaderSearch'
import PageTransition from './PageTransition'

// User Components
import UserBadges from './UserBadges'
import UserProfile from './UserProfile'

// Post Components
import MediaPlayer from './MediaPlayer'
import PostCard from './PostCard'
import Like_button from './Like_button'
import MainFeed from './MainFeed'
import PostCreator from './PostCreator'

// Mix & Export all
export {
  Feather,
  App_about,
  MediaPlayer,
  UserBadges,
  PageTransition,
  HeaderSearch,
  UserProfile,
  MyLayout,
  Loader,
  PostCard,
  PostCreator,
  Like_button,
  MainFeed,
}
