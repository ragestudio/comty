import packagejson from 'packageJson'
import { verbosity } from '@nodecorejs/utils'
import axios from 'axios'

const getDataFromBuilds = (state, res) => {
  let setState = {
    versions: [],
    releases: {},
    lastestId: res[0].id
  }
  return new Promise(async (resolve) => {
    try {
      const forLength = res.length
      for (let i = 0; i < forLength; i++) {
        const element = res[i]
        let newRelease = element
        const regEx = new RegExp(/\(([^)]+)\)/).exec(element.body)[1]
        if (regEx != null) {
          newRelease.fromCommit = `https://github.com/${state.repo}/commit/${regEx}`
          newRelease.rawPackage = `https://raw.githubusercontent.com/${state.repo}/${regEx}/package.json`
          const packageFromRaw = await axios.get(newRelease.rawPackage)

          newRelease.packagejson = packageFromRaw.data
          setState.versions[i] = element.id
          setState.releases[element.id] = newRelease
        }

        if (i == (forLength - 1)) {
          resolve(setState)
        }
      }

    } catch (error) {
      verbosity.log(error)
    }
  })
}

export default {
  namespace: 'app',
  state: {
    loading: true,
    selected: {},
    repo: packagejson.gitRepo,
    releases: null,
    lastestId: null,
    systemOS: window.navigator.platform
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({
        type: 'getAllReleases', callback: (res) => {
          verbosity.log("All Releases >", res)
          dispatch({
            type: 'updateState', payload: {
              ...res, selected: res.releases[res.lastestId]
            }
          })
          dispatch({ type: 'query' })
        }
      })
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
      const state = yield select(state => state.app)

      yield put({ type: "updateState", payload: { loading: false } })
      verbosity.log(state)
    },
    *getAllReleases({ callback }, { call, put, select }) {
      const state = yield select(state => state.app)
      const endpoint = `https://api.github.com/repos/${state.repo}/releases`

      fetch(endpoint).then(response => response.json())
        .then(async (res) => {
          callback(await getDataFromBuilds(state, res))
        })
    },
    *getRelease({ id, callback }, { call, put, select }) {
      const state = yield select(state => state.app)
      const endpoint = `https://api.github.com/repos/${state.repo}/releases/${id}`

      fetch(endpoint).then(response => response.json())
        .then(async (res) => {
          callback(await getDataFromBuilds(state, [res]))
        })
    },
    *selectFromId({ id }, { call, put, select }) {
      const state = yield select(state => state.app)
      yield put({ type: "updateState", payload: { selected: state.releases[id] } })
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      }
    },
  },
}
