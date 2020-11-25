const jsonServer = require('json-server');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const encryptionMethods = require('./encryptionMethods.js');
const routes = require('./routes.json');

const db = low(new FileSync('db.json'));
const server = jsonServer.create();
const port = 3000;

const DEFAULT_KEY = 'default';

const getObjectKey = async (token) => {
  const decryptedInfo = await encryptionMethods.decryptSymetric(token);
  const payload = JSON.parse(decryptedInfo);

  return payload[process.env.ENCRYPTED_KEY] || DEFAULT_KEY;
};

const buildResponse = async (collection, objectKey) => {
  const responseKey = db.get(collection).get(objectKey).value()
    || db.get(collection).get(DEFAULT_KEY).value();

  return responseKey;
};

Object.keys(routes).forEach((key) => {
  const { method, collection } = routes[key];
  console.log(`\nRegistering route '${key}' with method '${method}' -> '${collection}'`);
  server[method](key, async (req, res, next) => {
    console.log(`\nNew request arrived with key ${key} and headers ${JSON.stringify(req.headers)}`);
    const token = req.headers.authorization;

    console.log(`\nToken value ${token}`);
    const objectKey = getObjectKey(token);

    console.log(`\nObject key ${JSON.stringify(objectKey)}`);
    const response = await buildResponse(collection, objectKey);

    console.log(`\nAccess to route ${key}`);
    res.jsonp(response);
  });
});

server.listen(port, () => {
  console.log(`\nServer is running on port ${port}`);
});
