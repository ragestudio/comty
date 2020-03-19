import {SetControls, CloseControls} from "../../../components/Layout/Control"
import {SwapMode} from '../../../components/Layout/Secondary'

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
