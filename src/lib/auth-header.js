import jwt from "jsonwebtoken";
import serverConfigs from "../../config/server";

const cert = serverConfigs.jwtSecretKey;
class AuthHeader {
  encodeUserLoginAuth(user) {
    return jwt.sign(user, cert);
  }

  decodeUserLoginAuth(token) {
    try {
      return jwt.verify(token, cert);
    } catch (error) {
      return error;
    }
  }
}
export default new AuthHeader();
