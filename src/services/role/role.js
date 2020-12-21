import { db } from "../../lib/mongo";

class RolesService {
    getRoles() {

        return db
        .collection("roles")
        .find()
        .toArray()
        .then(items => items.map(item => this.changeProperties(item)));
    }

    changeProperties(item) {
        if (item) {
        item.id = item._id.toString();
        delete item._id;
        
        }

        return item;
    }

}

export default new RolesService();
