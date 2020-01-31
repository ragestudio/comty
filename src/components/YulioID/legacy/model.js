import { router, pathMatchRegexp } from 'utils'
import api from 'api'

const { legacyloginUser } = api

export default {
  namespace: 'login',

  state: {},

  effects: {
    *login({ payload }, { put, call, select }) {
      const data = yield call(legacyloginUser, payload)
      const { locationQuery } = yield select(_ => _.app)
      if (data.success) {
        const { from } = locationQuery
        yield put({ type: 'app/query' })
        if (!pathMatchRegexp('/login', from)) {
          if (from === '/') router.push('/dashboard')
          else router.push(from)
        } else {
          router.push('/dashboard')
        }
      } else {
        throw data
      }
    },
  },
}
