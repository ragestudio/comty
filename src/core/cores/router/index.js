/**
* 
* Specify all core paths and export elements
* 
* @param {HTMLTableElement} router - Archives Paths
*/

import { history } from 'umi';

/**
 * Specify the paths of the files, in this case it is pointing to the root
 */
export const router = {
  go: e => {
    goTo.element('primaryContent');
    router.push(e);
  },
  push: e => {
    history.push({
      pathname: `${e}`,
    });
  },
  goprofile: () => {
    goTo.element('primaryContent');
    router.push(`/@${e}`);
  },
};

/**
 * You are exporting the elements to collect errors
 */
export const goTo = {
  top: id => {
    const element = document.getElementById(id);
    element.scrollTop = element.scrollHeight + element.clientHeight;
  },
  bottom: id => {
    const element = document.getElementById(id);
    element.scrollTop = element.scrollHeight - element.clientHeight;
  },
  element: element => {
    try {
      document.getElementById(element).scrollIntoView();
    } catch (error) {
      console.debug(error);
      return false;
    }
  },
};


export default router