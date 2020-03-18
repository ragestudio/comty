import {SetControls, CloseControls} from "../../../components/Layout/Control"
import {SwapMode} from '../../../components/Layout/Secondary.js'

export const SecondarySwap = {
    ext: ()=> {
        SwapMode.ext()
    },
    PostComments: (e) => {
        SwapMode.PostComments(e)
    },
}

export const ControlBar = {
    set: (e) => {
        SetControls(e)
    },
    close: () => {
        CloseControls()
    }
}
