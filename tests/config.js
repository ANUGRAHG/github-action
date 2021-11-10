const cred = require('./appEnv')
const vcap = cred.system_env_json.VCAP_SERVICES;
const appenv = cred.application_env_json.VCAP_APPLICATION;
let mockserverurl = appenv.application_uris[0].split(".");
mockserverurl[0] = "cpapp-srv-mocks";
mockserverurl = mockserverurl.join(".");


module.exports = {
    "token_url": vcap.xsuaa[0].credentials.url,
    "service_domain": 'https://' + appenv.application_uris[0],
    "mock_service_domain":'https://' + mockserverurl,
    "xsuaa": {
        "grant_type": "password",
        "client_id": vcap.xsuaa[0].credentials.clientid,
        "client_secret": vcap.xsuaa[0].credentials.clientsecret,
        "username": cred.pusername,
        "password": cred.puserpwd

    }
}