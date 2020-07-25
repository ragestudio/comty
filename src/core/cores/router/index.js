import { history } from 'umi';

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