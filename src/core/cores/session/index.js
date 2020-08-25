import endpoints from 'config/endpoints';
import { v3_model } from 'core/libs';

function auth(payload, callback) {
  if (!payload) return false;
  const { username, password, server_key } = payload;

  if (username && password) {
    const frame = { username: atob(username), password: atob(password) }
    v3_model.api_request(
      {
        body: frame,
        endpoint: endpoints.auth,
        serverKey: server_key,
        verbose: true,
      },
      (err, res) => {
        return callback(err, res);
      },
    );
  } else {
    const res = { status: 100, message: 'Invalid Credentials!' };
    return callback(res, false);
  }
}

function deauth() {

}

const backup = {
  get: () => {},
  set: () => {},
};



export { auth, deauth, backup };
