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
                                    commande:"$commande",
                                    date_updated:"$date_updated",
                                    date_created:"$date_created"
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
			if(items.length>0){
                var max = items[0]
                for (var i=1; i<items.length;i++){
                    if(items[i].date_updated>max.date_updated){
                        max = items[i]
                    }
                }
                return max
            }
			return {};
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
            work.stat.map(stats=>{
                stats.etat= stats.etat
                stats.matricule= stats.matCustomer[0]
                stats.name= stats.nameCustomer[0]
                delete stats.nameCustomer
                delete stats.matCustomer
                stats.commande=stats.commande.length
                stats.date_created= stats.date_created
                stats.date_updated= stats.date_updated
            })
            var max = work.stat[0]
            for (var i=1; i<work.stat.length;i++){
                if(work.stat[i].date_updated>max.date_updated){
                    max = work.stat[i]
                }
            }
            work.stat=max
            // if(work.stat.length>0){

                work.etat= work.stat.etat
                work.matricule= work.stat.matricule
                work.name= work.stat.name
                work.commande=work.stat.commande
                work.date_created= work.stat.date_created
                work.date_updated= work.stat.date_updated
            // }
            
            delete work.stat

		}

		return work;
	}


}

export default new ReportingService();
