import * as Icons from 'components/Icons'

export default [
  {
    id: 'session_noexpire',
    icon: <Icons.Watch />,
    type: 'switch',
    title: 'No expire session',
    description: 'Force the app to not expire any session... [Developer]',
  },
  {
    id: 'search_ontype',
    icon: <Icons.CornerDownRight />,
    type: 'switch',
    title: 'Detect input on search bar',
    description: 'Force the app to automaticly search when a type input is detected... [Developer]',
  },
  {
    id: 'post_hidebar',
    icon: <Icons.Menu />,
    type: 'switch',
    title: 'Auto hide postbar',
    description: 'Force the app to hide the post actions (likes, comments ...etc) automaticly... [Developer]',
  },
  {
    id: 'verbosity',
    icon: <Icons.Terminal />,
    type: 'switch',
    title: 'Enable core verbosity',
    description: 'Show all console logs... [Developer]',
  }
]
