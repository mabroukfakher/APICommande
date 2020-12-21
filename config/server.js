// config used by server side only
const dbHost = "127.0.0.1";
const dbPort = 27017;
const dbName = "ProjetPFE";
const dbUser = "";
const dbPass = "";
const dbCred =
  dbUser.length > 0 || dbPass.length > 0 ? `${dbUser}:${dbPass}@` : "";

const dbUrl =
  process.env.DB_URL || `mongodb://${dbCred}${dbHost}:${dbPort}/${dbName}`;
module.exports = {

  // used by API
  BaseURL: "http://localhost:3002",

  apiListenPort: 3001,
  
  // used by API
  mongodbServerUrl: dbUrl,

  // assest
  assetServer: {
    type: "local",
    domain: "http://localhost:3001",
    localBasePath: "public/content",
    filesUploadPath: "assets",
    themeImageUploadPath: "assets/images",
    composantUploadPath: "images/composant",
  },

  // key to sign tokens
  jwtSecretKey: "-",

  // key to sign store cookies
  cookieSecretKey: "-",

  developerMode: true
};
