// Reducers & helpers
import { Swapper } from 'components/layout/Overlay/index.tsx'
import { useSelector } from 'umi';
import { connect } from 'dva';

export function newSearch(payload){
    Swapper.openFragment({ id: 'search', position: 'primary' ,mode: 'half', element: <div>NAH</div> })
}