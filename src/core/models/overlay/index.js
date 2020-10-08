
import { Swapper } from 'components/Layout/Overlay'

export function newSearch(payload){
    Swapper.openFragment({ id: 'search', position: 'primary' ,mode: 'half', element: <div>NAH</div> })
}