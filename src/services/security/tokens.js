import { ObjectID } from "mongodb";
import jwt from "jsonwebtoken";
import { db } from "../../lib/mongo";
import parse from "../../lib/parse";
import settings from "../../lib/settings";




class SecurityTokensService {
  getTokens(params = {}) {
    const filter = {};

    const id = parse.getObjectIDIfValid(params.id);
    if (id) {
      filter._id = new ObjectID(id);
    }

    const matricule = parse.getString(params.matricule);
    if (matricule && matricule.length > 0) {
      filter.matricule = matricule;
    }
    const role = parse.getString(params.role)
    if (role && role.length > 0) {
      const tabRole=[role]
      filter.role ={ $in: tabRole }
    }

    return db
      .collection("tokens")
      .find(filter)
      .toArray()
      .then(items => items.map(item => this.changeProperties(item)));
  }


  getSingleToken(id) {
    if (!ObjectID.isValid(id)) {
      return {status:false,message:"Invalid identifier"}
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
      .then(tokenData => {
        if(tokenData.status===true)
        return db.collection("tokens").insertMany([tokenData.token])
        return tokenData
        })
      .then(res =>{
        
        if(res.status===false)
        return res
        return this.getSingleToken(res.ops[0]._id.toString())
        })
      .then(token =>{
        if(token.status===false)
        return token
        
        return this.getSignedToken(token).then(signedToken => {
          token.token = signedToken;
          return token;
        })
      });
  }

  updateToken(id, data) {
    if (!ObjectID.isValid(id)) {
      return {status:false,message:"Invalid identifier"}

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
      return {status:false,message:"Invalid identifier"}
    }
    const tokenObjectID = new ObjectID(id);
    return db
      .collection("tokens")
      .deleteOne({ _id: tokenObjectID })
      .then(deleteResponse => deleteResponse.deletedCount > 0);
  
  }

  async checkTokenMatriculeUnique(matricule) {
    if (matricule && matricule.length > 0) {
      return db
        .collection("tokens")
        .countDocuments({ matricule })
        .then(count =>{
          if(count === 0) {
            return {status:true, matricule:matricule}  
          } 
          return {status:false,message:"Token matricule must be unique"}
         
        });
    }

    return {status:false,message:"matricule empty"};
  }

  getValidDocumentForInsert(data) {
    const matricule = parse.getString(data.matricule);
    return this.checkTokenMatriculeUnique(matricule).then(matricule => {
      if(matricule.status)
      { 
          const token = {
            date_created: new Date()
          };

          token.name = parse.getString(data.name);
          if (matricule && matricule.matricule&& matricule.matricule.length > 0) {
            token.matricule = matricule.matricule;
          }
          token.role = parse.getArrayIfValid(data.role);
          token.password = parse.getString(data.password);
          return {status:true,token:token}; 
      }
      return matricule
    });
  }

  getValidDocumentForUpdate(id, data) {
    if (Object.keys(data).length === 0) {
      return {status:false,message:"Required fields are missing"};
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
        role: token.role,
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
    return this.VerifMatriculegetSingleToken(matricule, password).then(token => {
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
      return { status: true, data: { token: token } , message: "Access Success"};
    }
    return { status: false, message: "Access Denied" };
  }

}

export default new SecurityTokensService();
