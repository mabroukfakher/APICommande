import { ObjectID } from "mongodb";
import url from "url";
import settings from "../../../lib/settings";
import { db } from "../../../lib/mongo";
import parse from "../../../lib/parse";
import fse from 'fs-extra';
import path from 'path';
import utils from '../../../lib/utils';

const ResolveSystemPath = (dir, file = "") => {
	const BaseAssetPath = `${settings.assetServer.localBasePath}`;
  
	const paths = [BaseAssetPath, dir, file].filter(
	  x => typeof x === "string" && x.length > 0
	);
  
	return path.resolve(paths.join("/"));
};

class CommandeService {

	getFilter(params = {}) {

        let filter = {};
        
		const id = parse.getObjectIDIfValid(params.id);
		if (id) {
			filter._id = new ObjectID(id);
        }

        const ordreFabrication = parse.getString(params.ordreFabrication);
        if (ordreFabrication != "") {
            filter.ordreFabrication = ordreFabrication;
        }

        const post = parse.getString(params.post);
        if (post != "") {
            filter.post = post;
        }

        const codeClientProduit = parse.getString(params.codeClientProduit);
        if (codeClientProduit != "") {
            filter.codeClientProduit = codeClientProduit;
        }

        const codeClient = parse.getString(params.codeClient);
        if (codeClient != "") {
            filter.codeClient = codeClient;
        }

		const search = parse.getString(params.search);
		if (search != "") {
			filter['$or'] = [
				{ ordreFabrication: new RegExp(params.search, 'i') },
                { post: new RegExp(params.search, 'i') },
                { codeClientProduit: new RegExp(params.search, 'i') },
                { composant: new RegExp(params.search, 'i') },
                { codeClient: new RegExp(params.search, 'i') },
                { produit: new RegExp(params.search, 'i') }
			];
		}

		return filter;
	}
    
    getCommandes(params) {
		const filter = this.getFilter(params);
		const limit = parse.getNumberIfPositive(params.limit) || 10000;
		const offset = parse.getNumberIfPositive(params.offset) || 0;
        const domain = settings.assetServer.domain;

		return Promise.all([
			db
				.collection('commandeInsetion')
				.find(filter)
				.skip(offset)
				.limit(limit)
				.toArray(),
			db.collection('commandeInsetion').countDocuments(filter),
		]).then(
			([commandes,commandesCount]) => {
				const items = commandes.map(commande =>
					this.changeProperties(commande,domain)
				);
				const result = {
					total_count: commandesCount,
					has_more: offset + items.length < commandesCount,
					data: items
				};
				return result;
			}
		);
    }
    
    changeProperties(item, domain) {
		if (item) {
			item.id = item._id.toString();
			delete item._id
			
			item.composants = this.getSortedComposantsWithUrls(item, domain);

		}

		return item;
    }
    
    getSortedComposantsWithUrls(item, domain) {
		if (item.composants && item.composants.length > 0) {
			return item.composants
				.map(composant => {
					composant= this.getCommandeUrl(domain, item.id, composant);
					return composant;
				})
				
		} else {
			return item.composants;
		}
    }

    getCommandeUrl(domain, commandeId, composant) {
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
    
    getSingleCommande(id) {
		if (!ObjectID.isValid(id)) {
            return {status:false,message:"Invalid identifier"};
		}
		return this.getCommandes({ id: id, limit: 1 }).then(
			commandes => (commandes.data.length > 0 ? commandes.data[0] : {})
		);
    }
    
	async getValidDocumentForInsert(data) {

		let commande = {
			date_created: new Date(),
			date_updated: null,
			composants: [],

		};

		commande.ordreFabrication = parse.getString(data.ordreFabrication);
		commande.produit = parse.getString(data.produit);
		commande.codeClient = parse.getString(data.codeClient);
		commande.quantite = parse.getNumberIfPositive(data.quantite) || 0;
		commande.composant = parse.getString(data.composant) ;
		commande.codeClientProduit = parse.getString(data.codeClientProduit);
        commande.dateDebut = parse.getDateIfValid(data.dateDebut);
        commande.post = parse.getString(data.post);

		return commande
    }
    
    addCommande(data) {
		return this.getValidDocumentForInsert(data)
			.then(dataToInsert =>
				db.collection('commandeInsetion').insertMany([dataToInsert])
			)
			.then(async res =>{ 
				if(res.insertedCount > 0) 
				{
					const commande =await this.getSingleCommande(res.ops[0]._id.toString())
					return {status:true, data : commande, message :'Vous avez crée une nouvelle commande. Continuez les procédures'}
				}
				return {status:false, data : null, message :'ADD failed'}

			});
	}

	async getValidDocumentForUpdate(data) {

		if (Object.keys(data).length === 0) {
            return {status:false,message:"Required fields are missing"};
		}

		let commande = {
			date_updated: new Date()
		};

		if (data.ordreFabrication !== undefined) {
            commande.ordreFabrication = parse.getString(data.ordreFabrication);
		}

		if (data.produit !== undefined) {
            commande.produit = parse.getString(data.produit);
		}

		if (data.codeClient !== undefined) {
            commande.codeClient = parse.getString(data.codeClient);
		}

        if (data.quantite !== undefined) {
            commande.quantite = parse.getNumberIfPositive(data.quantite)
        }

        if (data.composant !== undefined) {
            commande.composant = parse.getString(data.composant) ;
        }
        
        if (data.codeClientProduit !== undefined) {
            commande.codeClientProduit = parse.getString(data.codeClientProduit);
        }

        if (data.dateDebut !== undefined) {
            commande.dateDebut = parse.getDateIfValid(data.dateDebut);
        }
        
        if (data.post !== undefined) {
            commande.post = parse.getString(data.post);
        }

		return commande
    }
    
    updateCommande(id, data) {
		if (!ObjectID.isValid(id)) {
            return {status:false,message:"Invalid identifier"};
		}
		const commandeObjectID = new ObjectID(id);

		return this.getValidDocumentForUpdate(data)
			.then(dataToSet =>
				db
					.collection('commandeInsetion')
					.updateOne({ _id: commandeObjectID }, { $set: dataToSet })
			)
			.then(async res =>{ 
				if(res.modifiedCount > 0) 
				{
					const commande =await this.getSingleCommande(id)
				 	return {status:true, data :commande, message :'update succes'}
				}

				return {status:false, data : null, message :'update failed'}

			});
    }
    
    deleteCommande(commandeId) {
		if (!ObjectID.isValid(commandeId)) {
			return {status:false,message:"Invalid identifier"}
		}
		const commandeObjectID = new ObjectID(commandeId);
		const domain = settings.assetServer.domain;

		// 1. delete Commande
		return db
			.collection('commandeInsetion')
			.deleteOne({ _id: commandeObjectID })
			.then(deleteResponse => {
				if (deleteResponse.deletedCount > 0) {
					// 2. delete directory with composants
					let deleteDir = settings.assetServer.composantUploadPath + '/' + commandeId
					const dirPath = ResolveSystemPath(deleteDir);
					fse.remove(dirPath);
				}
				return deleteResponse.deletedCount > 0;
			});
	}

}

export default new CommandeService();
