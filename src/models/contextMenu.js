import { OpenContextMenu, DestroyContextMenu } from 'components/Layout/ContextMenu'
import verbosity from 'core/libs/verbosity'

const defaultState = {
    xPos: 0,
    yPos: 0,
    renderList: null,
    eventHandlers: [],
}

export default {
    namespace: 'contextMenu',
    state: defaultState,
    subscriptions: {
        setup({ dispatch }) {
            window.contextMenu = {
                open: (payload) => {
                    if (!payload) return false
                    dispatch({ type: "open", payload })
                },
                destroy: () => {
                    dispatch({ type: "destroy" })
                },
                addEventListener: (payload) => {
                    if (!payload) return false
                    dispatch({ type: "handleAddEvent", payload: payload })
                }
            }

            document.getElementById("root").addEventListener("contextmenu", (e) => {
              e.preventDefault()
              dispatch({ type: "handleEvents", payload: e })
            }, false)

            dispatch({ type: "setup" })
        }
    },
    effects: {
      *setup({payload}, { select, put }){
          const state = yield select(state => state.contextMenu)
          window.contextMenu = { ...window.contextMenu, ...state }
      },
      *handleEvents({payload}, { select, put }){
        const eventHandlers = yield select(state => state.contextMenu.eventHandlers)
        verbosity(["New event recived =>", payload], { color: "magenta"})

        if (Array.isArray(eventHandlers)) {
          let byIndex = []
          let prioritys = []

          eventHandlers.forEach((e) => {
            if (typeof(e.ref) !== "undefined") {
              if (e.ref.contains(payload.srcElement)) {
                byIndex[e.priority] = e
                prioritys = Object.keys(byIndex).sort()
              }
            }
          })

          prioritys = prioritys.reverse()
          const prioritaryEvent = byIndex[prioritys[0]]
    
          if (prioritaryEvent != null && typeof(prioritaryEvent.onEventRender) !== "undefined") {
            window.contextMenu.open({
              renderList: prioritaryEvent.onEventRender, 
              ...prioritaryEvent.props, 
              yPos: payload.clientY, 
              xPos: payload.clientX,
              event: payload
            })
          }else{
            verbosity('not valid events detected')
          }

        }else{
          verbosity('eventHandlers is not an array, exiting')
        }
        
      },
      *open({payload}, { select, put }){
        OpenContextMenu(payload)
      }
    },
    reducers: {
      updateState(state, { payload }) {
        return {
          ...state,
          ...payload,
        };
      },
      handleAddEvent(state, { payload }){
        let tmp = []
        tmp.push(payload)

        const concated = state.eventHandlers.concat(tmp)
        state.eventHandlers = concated
      },
      open(state, { payload }){
        state = {...state, ...payload}
      },
      close(state){
        state = {...state, ...payload}
        DestroyContextMenu()
      }
    },
}
