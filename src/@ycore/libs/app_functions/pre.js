import {SetControls, CloseControls} from "../../../components/Layout/Control"
import {SwapMode} from '../../../components/Layout/Secondary'


export function QueryRuntime() {

}
export const CheckThisApp = {
    desktop_mode: () => {
        const a  = localStorage.getItem('desktop_src')
        if (a == 'true') {
            return true
        }
        return false
    },

}

export const SecondarySwap = {
    ext: ()=> {
        SwapMode.ext()
    },
    PostComments: (e) => {
        SwapMode.PostComments(e)
    },
    openPost: (e) => {
        SwapMode.openPost(e)
    }
}

export const ControlBar = {
    set: (e) => {
        SetControls(e)
    },
    close: () => {
        CloseControls()
    }
}
