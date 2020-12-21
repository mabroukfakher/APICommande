import { ObjectID } from "mongodb";
import jwt from "jsonwebtoken";
import lruCache from "lru-cache";
import { db } from "../../lib/mongo";
import parse from "../../lib/parse";
import settings from "../../lib/settings";

const cache = lruCache({
  max: 10000,
  maxAge: 1000 * 60 * 60 * 24 // 24h
});

const BLACKLIST_CACHE_KEY = "blacklist";

class SecurityTokensService {
  getTokens(params = {}) {


    const id = parse.getObjectIDIfValid(params.id);
    if (id) {
      filter._id = new ObjectID(id);
    }

    const matricule = parse.getString(params.matricule);
    if (matricule && matricule.length > 0) {
      filter.matricule = matricule;
    }

    return db
      .collection("tokens")
      .find(filter)
      .toArray()
      .then(items => items.map(item => this.changeProperties(item)));
  }


  getSingleToken(id) {
    if (!ObjectID.isValid(id)) {
      return Promise.reject("Invalid identifier");
    }
    return this.getTokens({ id }).then(items =>
      items.length > 0 ? items[0] : null
    );
  }

  VerifMatriculegetSingleToken(matricule, password) {
    return this.getTokens({ matricule }).then(items =>
      items.length > 0 && items[0].password === password ? items[0] : null
    );
  }

  addToken(data) {
    return this.getValidDocumentForInsert(data)
      .then(tokenData => db.collection("tokens").insertMany([tokenData]))
      .then(res => this.getSingleToken(res.ops[0]._id.toString()))
      .then(token =>
        this.getSignedToken(token).then(signedToken => {
          token.token = signedToken;
          return token;
        })
      );
  }

  updateToken(id, data) {
    if (!ObjectID.isValid(id)) {
      return Promise.reject("Invalid identifier");
    }
    const tokenObjectID = new ObjectID(id);
    const token = this.getValidDocumentForUpdate(id, data);

    return db
      .collection("tokens")
      .updateOne(
        {
          _id: tokenObjectID
        },
        { $set: token }
      )
      .then(res => this.getSingleToken(id));
  }

  deleteToken(id) {
    if (!ObjectID.isValid(id)) {
      return Promise.reject("Invalid identifier");
    }
    const tokenObjectID = new ObjectID(id);
    return db
      .collection("tokens")
      .updateOne(
        {
          _id: tokenObjectID
        },
        {
          $set: {
            date_created: new Date()
          }
        }
      )
      .then(res => {
        cache.del(BLACKLIST_CACHE_KEY);
      });
  }

  checkTokenMatriculeUnique(matricule) {
    if (matricule && matricule.length > 0) {
      return db
        .collection("tokens")
        .countDocuments({ matricule })
        .then(count =>
          count === 0 ? matricule : Promise.reject("Token matricule must be unique")
        );
    }
    return Promise.resolve(matricule);
  }

  getValidDocumentForInsert(data) {
    const matricule = parse.getString(data.matricule);
    return this.checkTokenMatriculeUnique(matricule).then(matricule => {
      const token = {
        date_created: new Date()
      };

      token.name = parse.getString(data.name);
      if (matricule && matricule.length > 0) {
        token.matricule = matricule;
      }
      token.scopes = parse.getArrayIfValid(data.scopes);
      token.password = parse.getString(data.password);
      return token;
    });
  }

  getValidDocumentForUpdate(id, data) {
    if (Object.keys(data).length === 0) {
      return new Error("Required fields are missing");
    }

    const token = {
      date_updated: new Date()
    };

    if (data.name !== undefined) {
      token.name = parse.getString(data.name);
    }
    if (data.password !== undefined) {
      token.password = parse.getString(data.password);
    }

    return token;
  }

  changeProperties(item) {
    if (item) {
      item.id = item._id.toString();
      delete item._id;
    
    }

    return item;
  }

  getSignedToken(token) {
    return new Promise((resolve, reject) => {

      const payload = {
        scopes: token.scopes,
        jti: token.id
      };

      if (token.matricule && token.matricule.length > 0) {
        payload.matricule = token.matricule;
      }


      jwt.sign(payload, settings.jwtSecretKey, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  }

  getDashboardSignin(matricule, password) {
    return this.VerifMAtriculegetSingleToken(matricule, password).then(token => {
      if (token) {
        return this.getSignedToken(token).then(signedToken => {
          return signedToken;
        });
      }
      return null;
    });
  }

  async DashboardSignin(req) {
    const { matricule, password } = req.body;
    const token = await this.getDashboardSignin(matricule, password);
    if (token) {
      return { status: true, data: { token: token } };
    }
    return { status: false, message: "Access Denied" };
  }

}

export default new SecurityTokensService();
