import {
  Constant
} from './_utils'
const {
  ApiPrefix
} = Constant

const database = [
  
  // DASHBOARD SECTION
  {
    id: '1',
    icon: 'home',
    name: 'Main',
    route: '/main',
  },
  {
    id: '2',
    icon: 'user',
    name: 'App Settings',
    route: '/settings'
  }

]

module.exports = {
  [`GET ${ApiPrefix}/routes`](req, res) {
    res.status(200).json(database)
  },
}