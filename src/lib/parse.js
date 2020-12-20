import { ObjectID } from "mongodb";

const getString = value => (value || "").toString();

const getDateIfValid = value => {
  const date = Date.parse(value);
  return isNaN(date) ? null : new Date(date);
};

const getArrayIfValid = value => (Array.isArray(value) ? value : null);

const getObjectIDIfValid = value =>
  ObjectID.isValid(value) ? new ObjectID(value) : null;

const getArrayOfObjectID = value => {
  if (Array.isArray(value) && value.length > 0) {
    return value.map(id => getObjectIDIfValid(id)).filter(id => !!id);
  }
  return [];
};
const isNumber = value => !isNaN(parseFloat(value)) && isFinite(value);

const getNumberIfValid = value => (isNumber(value) ? parseFloat(value) : null);

const getNumberIfPositive = value => {
  const n = getNumberIfValid(value);
  return n >= 0 ? n : null;
};
const getNumberIfPositiveP= value => {
  const n = getNumberIfValid(value);
  return n >= 0 ? n : 0;
};
const getBooleanIfValid = (value, defaultValue = null) => {
  if (value === "true" || value === "false") {
    return value === "true";
  }
  return typeof value === "boolean" ? value : defaultValue;
};

const getBoolean = value => {
  if (value === "true") {
    return value === "true";
  }
  if (value === "false") {
    return value === "true";
  }
  return null;
};

const getBooleanQuesiton = value => {
  if (value === "true") {
    return value === "true";
  }
  if (value === "false") {
    return value === "true";
  }
  return false;
};

export default {
  getString,
  getObjectIDIfValid,
  getDateIfValid,
  getArrayIfValid,
  getArrayOfObjectID,
  getNumberIfValid,
  getNumberIfPositive,
  getNumberIfPositiveP,
  getBooleanIfValid,
  getBoolean,
  getBooleanQuesiton
};
