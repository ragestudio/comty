module.exports = [
  {
    id: 'session_noexpire',
    type: 'switch',
    title: 'No expire session',
    description: 'Force the app to not expire any session... [Developer]',
  },
  {
    id: 'search_ontype',
    type: 'switch',
    title: 'Detect input on search bar',
    description:
      'Force the app to automaticly search when a type input is detected... [Developer]',
  },
  {
    id: 'post_hidebar',
    type: 'switch',
    title: 'Auto hide postbar',
    description: 'Force the app to dont hide the post actions (likes, comments ...etc) automaticly... [Developer]',
  },
  {
    id: 'verbosity',
    type: 'switch',
    title: 'Enable core verbosity',
    description: 'Show all console logs... [Developer]',
  },
  {
    id: 'overlay_loosefocus',
    type: 'switch',
    title: 'Overlay loose focus',
    description: 'Close the overlay when loose focus',
  },
]
