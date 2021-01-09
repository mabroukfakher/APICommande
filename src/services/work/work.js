import { ObjectID } from 'mongodb';
import { db } from '../../lib/mongo';
import parse from '../../lib/parse';
import url from "url";
import settings from "../../lib/settings";

class WorkService {
	
	getFilter(params = {}) {

        let filter = {};
        let fromTable = {};
		const id = parse.getObjectIDIfValid(params.id);
		if (id) {
			filter._id = new ObjectID(id);
        }
		
        const customerId = parse.getObjectIDIfValid(params.customerId);
		if (customerId) {
			filter.customerId = new ObjectID(customerId);
        }
        
        const typeCommande = parse.getString(params.typeCommande);
        //typeCommande = "commandeInsetion" || "commandePreparation"
        if (typeCommande!="") {
			fromTable.typeCommande = typeCommande;
		}else{
            fromTable.typeCommande = "commandeInsetion"
        }


		return {filter:filter,fromTable:fromTable};
	}

	getWorks(params = {}) {
    let { filter, fromTable } = this.getFilter(params)

    return Promise.all([
      db
        .collection("works")
        .aggregate([
          {
            $match: filter,
          },
          {
            $lookup: {
              from: "tokens",
              localField: "customerId",
              foreignField: "_id",
              as: "customer",
            },
          },
          {
            $lookup: {
              from: fromTable.typeCommande,
              localField: "commandeId",
              foreignField: "_id",
              as: "commande",
            },
          },
          { $sort: { date_updated: -1 } },
        ])
        .toArray(),
    ]).then(([works]) => {
      var items = works.map((work) => this.changeProperties(work, fromTable))

      return items
    })
  }

	getSingleWork(id) {
		if (!ObjectID.isValid(id)) {
            return {status:false,message:"Invalid identifier"};
		}
		return this.getWorks({ id: id }).then(items =>
			items.length > 0 ? items[0] : {}
		);
    }
    getProfil(id,data) {
		if (!ObjectID.isValid(id)) {
            return {status:false,message:"Invalid identifier"};
		}
		return this.getWorks({ customerId: id,...data }).then(items =>{
            if(items.length > 0) 
              return {status:true,data:items[0]}
            return{status:false,message:"No Commande"}
		});
    }

	async addWork(data) {
		const work = this.getValidDocumentForInsert(data);

		return await db
			.collection('works')
			.insertMany([work])
            .then(res =>{ 
				if(res.insertedCount > 0) 
				{
					return {status:true, message :'Commande lancée avec success'}
				}
				return {status:false, data : null, message :'Commande failed'}

			});
	}

	async updateWork(id, data) {
		if (!ObjectID.isValid(id)) {
			return {status:false,message:"Invalid identifier"};
		}
		const workObjectID = new ObjectID(id);
		const work = this.getValidDocumentForUpdate(data);


		return db.collection('works').updateOne(
			{
				_id: workObjectID
			},
			{
				$set: work
			}
		).then(res =>{ 
            if(res.modifiedCount > 0) 
            {
                 return {status:true, message :'update succes'}
            }

            return {status:false, data : null, message :'update failed'}

        });


	}

	async deleteWork(workId) {
		if (!ObjectID.isValid(workId)) {
			return Promise.reject('Invalid identifier');
		}
		const workObjectID = new ObjectID(workId);

        const deleteResponse = await db
			.collection('works')
			.deleteOne({ _id: workObjectID });

		return deleteResponse.deletedCount > 0;
	}

	getValidDocumentForInsert(data) {
		let work = {
			date_created: new Date(),
			date_updated: new Date(),
			etat: "play"
		};

		work.customerId = parse.getObjectIDIfValid(data.customerId);
		work.commandeId = parse.getObjectIDIfValid(data.commandeId);

		return work;
	}

	getValidDocumentForUpdate(data) {
		if (Object.keys(data).length === 0) {
            return {status:false,message:"Required fields are missing"};
		}

		let work = {
			date_updated: new Date()
		};

		if (data.customerId !== undefined) {
            work.customerId = parse.getObjectIDIfValid(data.customerId);
		}
		
		if (data.commandeId !== undefined) {
			work.commandeId = parse.getObjectIDIfValid(data.commandeId);
		}

		if (data.etat !== undefined) {
			work.etat = parse.getString(data.etat);
		}

		return work;
	}

	changeProperties(work,fromTable) {
    const domain = settings.assetServer.domain

    if (work) {
      work.id = work._id.toString()
      delete work._id
      delete work.customerId
      delete work.commandeId
      delete work.date_created
      delete work.date_updated
      work.customer = work.customer[0]
      work.commande = work.commande[0]
      delete work.customer.date_created
      delete work.customer.date_updated
      delete work.customer.role
      delete work.customer.password
      work.customer.id = work.customer._id.toString()
      delete work.customer._id
      if (work.commande != undefined) {
        delete work.commande.date_created
        delete work.commande.date_updated
        work.commande.id = work.commande._id.toString()
        delete work.commande._id

        if (fromTable.typeCommande === "commandeInsetion") {
          work.commande.composants = this.getSortedComposantsInsertionWithUrls(
            work.commande,
            domain
          )
        } else {
          work.commande = this.getCommandePreparationUrl(work.commande, domain)
        }
      }
    }

    return work
  }

	getSortedComposantsInsertionWithUrls(item, domain) {
		if (item.composants && item.composants.length > 0) {
			return item.composants
				.map(composant => {
					composant= this.getCommandeInsertionUrl(domain, item.id, composant);
					return composant;
				})
				
		} else {
			return item.composants;
		}
	}

	getCommandeInsertionUrl(domain, commandeId, composant) {
        composant.shema = url.resolve(
            domain,
            `${settings.assetServer.composantUploadPath}/${commandeId}/${composant.shema}`
        );
        composant.image = url.resolve(
            domain,
            `${settings.assetServer.composantUploadPath}/${commandeId}/${composant.image}`
        );
        return composant;

	}

	getCommandePreparationUrl(item,domain) {
        item.shema = url.resolve(
            domain,
            `${settings.assetServer.commandePreparationUploadPath}/${item.shema}`
        );
        item.image = url.resolve(
            domain,
            `${settings.assetServer.commandePreparationUploadPath}/${item.image}`
        );
        return item;

	}

}

export default new WorkService();
