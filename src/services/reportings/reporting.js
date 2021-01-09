import { ObjectID } from 'mongodb';
import { db } from '../../lib/mongo';
import parse from '../../lib/parse';
import url from "url";
import settings from "../../lib/settings";
import { stat } from 'fs';
import { nextTick } from 'process';

class ReportingService {
    
    getReporingsCommandeInsetion(){
        return Promise.all([
			db
                .collection('works')
                .aggregate([
                    
                    {
                        $lookup: {
                            from: 'tokens',
                            localField: 'customerId',
                            foreignField: '_id',
                            as: 'customer'
                        }
                    },
                    {
                        $lookup: {
                            from: "commandeInsetion", //commandePreparation
                            localField: 'commandeId',
                            foreignField: '_id',
                            as: 'commande'
                        }
                    },
                    {
                        $group: {
                            _id: "$commande.post",
                            stat: {
                                $push: {
                                    id: "$_id",
                                    nameCustomer:"$customer.name",
                                    matCustomer:"$customer.matricule",
                                    etat:"$etat",
                                    commande:"$commande"
                                }
                            }
                        }
                    }
                    // { $sort: { date_created: -1 } },
            
                ])
				.toArray(),
		]).then(([works]) => {
			var items = works.map(work =>
				this.changeProperties(work)
            );
            
            for (var i=0; i<items.length;i++){
                if(items[i].commande===0){
                     items.splice(i,1)
                     i--
                }
            }
			
			return items;
		});
    }

    getReporingsCommandePreparation(){
        return Promise.all([
			db
                .collection('works')
                .aggregate([
                    
                    {
                        $lookup: {
                            from: 'tokens',
                            localField: 'customerId',
                            foreignField: '_id',
                            as: 'customer'
                        }
                    },
                    {
                        $lookup: {
                            from: "commandePreparation", //commandePreparation
                            localField: 'commandeId',
                            foreignField: '_id',
                            as: 'commande'
                        }
                    },
                 
            
                ])
				.toArray(),
		]).then(([works]) => {
			var items = works.map(work =>
				this.changePropertiesCP(work)
            );
            
            for (var i=0; i<items.length;i++){
                if(items[i].commande===0){
                     items.splice(i,1)
                     i--
                }
            }
			
			return items.length>0 ? items[0] :{};
		});
    }

    changePropertiesCP(work) {

		if (work) {
		
            work.post = "Poste preparation"
            delete work._id
            
            if(work.customer.length>0){

              
                work.matricule= work.customer[0].matricule
                work.name= work.customer[0].name
               
            }
            work.commande=work.commande.length
            delete work.customer

		}

		return work;
    }
    
    changeProperties(work) {

		if (work) {
		
            work.post = work._id[0]
            delete work._id
            if(work.stat.length>0){

                work.etat= work.stat[0].etat
                work.matricule= work.stat[0].matCustomer[0]
                work.name= work.stat[0].nameCustomer[0]
                work.commande=work.stat[0].commande.length
            }
            
            delete work.stat

		}

		return work;
	}


}

export default new ReportingService();
