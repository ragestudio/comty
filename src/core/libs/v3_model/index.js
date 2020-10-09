import v3_request from 'api/lib/v3_request'
import endpointList from 'config/endpoints'
import { app_config } from 'config'

const { api_prefix } = app_config;

export async function api_request(payload, callback) {
  if (!payload) return false;
  const { endpoint, body, serverKey, userToken  } = payload;
  
  let petition = {
    prefix: api_prefix,
    endpointList,
    endpoint
  }
  
  body ? (petition.body = body) : null;
  serverKey ? (petition.server_key = serverKey) : null;
  userToken ? (petition.access_token = userToken) : null;

  v3_request(petition, (...res) => {
    return callback(...res);
  })
}

