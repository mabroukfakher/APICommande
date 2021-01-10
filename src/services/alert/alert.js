import { ObjectID } from 'mongodb';
import { db } from '../../lib/mongo';
import parse from '../../lib/parse';
import url from "url";
import settings from "../../lib/settings";

class AlertService {
	
	getFilter(params = {}) {

        let filter = {
            status:true
        };

		return filter
	}

	getAlert(params = {}) {
        let  filter = this.getFilter(params)

        return Promise.all([
            db
                .collection("alert")
                .find(filter)
                .toArray(),
            ]).then(([alerts]) => {
            var items = alerts.map((alert) => this.changeProperties(alert))

            return items
            })
    }

	async addAlert(data) {
		const alert = this.getValidDocumentForInsert(data);

		return await db
			.collection('alert')
			.insertMany([alert])
            .then(res =>{ 
				if(res.insertedCount > 0) 
				{
					return {status:true, message :'Alert success'}
				}
				return {status:false, data : null, message :'Alert failed'}

			});
	}

	async updateAlert(id, data) {
		if (!ObjectID.isValid(id)) {
			return {status:false,message:"Invalid identifier"};
		}
		const alertObjectID = new ObjectID(id);
		const alert = this.getValidDocumentForUpdate(data);


		return db.collection('alert').updateOne(
			{
				_id: alertObjectID
			},
			{
				$set: alert
			}
		).then(res =>{ 
            if(res.modifiedCount > 0) 
            {
                 return {status:true, message :'update succes'}
            }

            return {status:false, data : null, message :'update failed'}

        });


	}

	getValidDocumentForInsert(data) {
		let alert = {
			date_created: new Date(),
			date_updated: null,
			status: true
		};

		alert.workId = parse.getObjectIDIfValid(data.workId);
		alert.post = parse.getString(data.post);
		alert.customerName = parse.getString(data.customerName);
		alert.customerMat = parse.getString(data.customerMat);

		return alert;
	}

	getValidDocumentForUpdate(data) {

		let work = {
            date_updated: new Date(),
            status:false
		};

		return work;
	}

	changeProperties(alert) {
  
        if (alert) {
            alert.id = alert._id.toString()
            delete alert._id
        }

        return alert
    }

}

export default new AlertService();
