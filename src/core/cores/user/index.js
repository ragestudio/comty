import endpoints from 'config/endpoints';
import { v3_model } from 'core/libs';

const set = {
  data: () => {
    // TODO
  },
};

const get = {
  data: parms => {
    if (!parms) return false;
    const { id, type } = parms;

    if (!id) {
      // core get id data from current session
    }
    v3_model.api_request(
      {
        endpoint: endpoints.get_data,
        verbose: true,
      },
      (err, res) => {
        console.log(err, res);
      },
    );
  },
  posts: parms => {
    if (!parms) return false;
    const { id } = parms;

    if (!id) {
      // core get id data from current session
    }
  },
  profileData: parms => {
    if (!parms) return false;
    const { id } = parms;

    if (!id) {
      // core get id data from current session
    }
  },
};

const actions = {
  block: parms => {
    if (!parms) return false;
    const { id, toID } = parms;
  },
  find: parms => {
    if (!parms) return false;
    const { id, username, email } = parms;
  },
  follow: parms => {
    if (!parms) return false;
    const { id, toID } = parms;
  },
};

export {
  //set
  get,
  actions,
};
