import { lib, v3_request } from 'api';
import endpoints_list from 'config/endpoints';
import { app_config } from 'config';
import * as core from 'core'
import { connect } from 'dva';

const { api_prefix } = app_config;
const { uri_resolver } = lib;


async function compileURI(e, callback) {
  const resolvers = await uri_resolver();
  const prefix = resolvers[api_prefix];

  let final = null;
  let url;
  let method;

  const endpointSplit = e.split(' ');
  if (endpointSplit.length === 2) {
    method = endpointSplit[0];
    url = endpointSplit[1];
    url = prefix + url;
    return callback({ url, method });
  }

  Object.values(endpoints_list).find(item => {
    url = item;
    method = 'GET';
    const paramsArray = item.split(' ');
    if (paramsArray.length === 2) {
      method = paramsArray[0];
      url = paramsArray[1];
    }
    if (e === url) {
      url = prefix + url;
      return (final = { url, method });
    }
  });
  return callback(final);
}

async function api_request(e, callback) {
  if (!e) return false;
  const { endpoint, body, serverKey, userToken, verbose } = e;

  compileURI(endpoint, res => {
    let petition = {
      method: res.method,
      url: res.url,
    };
    body ? (petition.body = body) : null;
    serverKey ? (petition.server_key = serverKey) : null;
    userToken ? (petition.access_token = userToken) : null;

    verbose ? console.log(`Requesting V3 =>`, petition) : null;
    v3_request(petition, (...res) => {
      return callback(...res);
    });
  });
}

export { compileURI, api_request };
