import { Watch, CornerDownRight, Menu, AlignCenter, Terminal } from 'components/Icons'

export default [
  {
    id: 'session_noexpire',
    icon: <Watch />,
    type: 'switch',
    title: 'No expire session',
    description: 'Force the app to not expire any session... [Developer]',
  },
  {
    id: 'search_ontype',
    icon: <CornerDownRight />,
    type: 'switch',
    title: 'Detect input on search bar',
    description: 'Force the app to automaticly search when a type input is detected... [Developer]',
  },
  {
    id: 'post_hidebar',
    icon: <Menu />,
    type: 'switch',
    title: 'Auto hide postbar',
    description: 'Force the app to hide the post actions (likes, comments ...etc) automaticly... [Developer]',
  },
  {
    id: 'post_autoposition',
    icon: <AlignCenter />,
    type: 'switch',
    title: 'Auto center on click',
    description: '',
  },
  {
    id: 'verbosity',
    icon: <Terminal />,
    type: 'switch',
    title: 'Enable core verbosity',
    description: 'Show all console logs... [Developer]',
  }
]
