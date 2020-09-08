/**
* 
* In this function it is the one that collects all the errors and then displays them by 'payload'
* 
* @param {HTMLTableElement} Interface Helper - Interface Errors
* Checks if a character is in the control string
* @param {string} position
* @param {string} id
* @param {string} mode
* @param {string} element
* @param {string} NAH
* @return {void} Nothing
* @param {Array} payload - TThis element generates the errors
*/

// Reducers & helpers
import { Swapper } from 'components/Layout/Overlay'
import { useSelector } from 'umi';
import { connect } from 'dva';

export function newSearch(payload){
    Swapper.openFragment({ id: 'search', position: 'primary' ,mode: 'half', element: <div>NAH</div> })
}