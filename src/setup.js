import winston from "winston";
import url from "url";
import { MongoClient } from "mongodb";
import settings from "./lib/settings";


const mongodbConnection = settings.mongodbServerUrl;
const mongoPathName = url.parse(mongodbConnection).pathname;
const dbName = mongoPathName.substring(mongoPathName.lastIndexOf("/") + 1);

const CONNECT_OPTIONS = {
  useNewUrlParser: true
};

const addTokens = async db => {
  await db.collection("tokens").insertOne({
    is_revoked: false,
    date_created: new Date(),
    name: "admin",
    scopes: ["admin"],
    expiration: 8760,
    email: "admin@rihab.com",
    date_updated: null,
    password: "admin"
  });
};

const addRoles = async db => {
  await db.collection("roles").insertOne({
    date_created: new Date(),
    name: "Chef",
    scopes: ["Chef"]
  });
  await db.collection("roles").insertOne({
    date_created: new Date(),
    name: "Préparation",
    scopes: ["preparation"]
  });
  await db.collection("roles").insertOne({
    date_created: new Date(),
    name: "Insertion",
    scopes: ["insertion"]
  });
};

(async () => {
  let client = null;
  let db = null;

  try {
    client = await MongoClient.connect(mongodbConnection, CONNECT_OPTIONS);
    db = client.db(dbName);
    winston.info(`Successfully connected to ${mongodbConnection}`);
  } catch (e) {
    winston.error(`MongoDB connection was failed. ${e.message}`);
    return;
  }

  await addTokens(db);
  await addRoles(db);

  client.close();
})();
