import { router, verbosity, ui } from 'core/libs'
import { DynamicSDCP } from 'core/libs/dynamicsdcp'
import settings from 'core/libs/settings'
import * as core from 'core'


export default {
  namespace: 'extended',
  state: {
    modules: { core, settings, verbosity, router, DynamicSDCP },
    sidebar: null,
    contextMenu: null
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'query' });
    },
  },
  effects: {
    *query({ payload }, { call, put, select }) {
    
    },
    *initializePlugins({ payload }, { select }) {
      const extended = yield select(state => state.extended)

      if (!payload.array) {
        verbosity("Only array map for initialize plugins", "Please read SDK documentation for more info.")
        return false
      }
      try {
        usePlugins([payload.array], (err, results) => {
          if (err) {
            verbosity(["Init error!", err])
            ui.notify.error("Plugin initialize error!", err)
            return false
          }
          const rootInit = results[0]

          if (!rootInit.uuid) {
            verbosity("Cannot initialize a plugin without UUID.", "Please read SDK documentation for more info.")
            ui.notify.error("Cannot initialize a plugin without UUID.")
            return false
          }

          let plugin = {
            uuid: null,
            version: "n/a",
            title: "Blank"
          }
          plugin = { ...plugin, ...rootInit }

          const rootClass = plugin.payload
          let extendedRequire = null

          class extendedPlugin extends rootClass {
            constructor(props) {
              super(props)
            }
          }

          if (typeof (plugin.requireExtends) !== "undefined") {
            console.log("Extending class with => ", plugin.requireExtends)

            plugin.requireExtends.forEach((e) => {
              const RequireFrom = e.from
              const RequireImport = e.import

              const existScheme = typeof (RequireImport) !== "undefined" && typeof (RequireFrom) !== "undefined"
              if (!existScheme) {
                verbosity("Invalid require extension!")
                return false
              }

              if (Array.isArray(RequireImport)) {
                RequireImport.forEach((e) => {
                  `console`.log(`Importing " ${e} " from [ ${RequireFrom} ]`)
                  extendedRequire[e] = require(RequireFrom)
                })
              } else {

              }

            })
          }

          window.PluginGlobals[plugin.uuid] = new extendedPlugin({ extended, extendedRequire })

          ui.notify.open({
            message: `${plugin.title} v${plugin.version}`,
            description: `New plugin is now installed !`
          })
        })
      } catch (error) {
        verbosity("Unexpected catched exception! ", error)

      }
    }
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
  },
};
