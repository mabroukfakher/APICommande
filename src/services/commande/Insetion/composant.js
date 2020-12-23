import { ObjectID } from "mongodb";
import url from "url";
import settings from "../../../lib/settings";
import { db } from "../../../lib/mongo";
import parse from "../../../lib/parse";
import formidable from 'formidable';
import fse from 'fs-extra';
import utils from '../../../lib/utils';

class InsertionService {

    async getcomposants(commandeId) {
		if (!ObjectID.isValid(commandeId)) {
            return {status:false,message:"Invalid identifier"}

		}
		let commandeObjectID = new ObjectID(commandeId);
        const assetsDomain = settings.assetServer.domain;
		return db
			.collection('commandeInsetion')
			.findOne({ _id: commandeObjectID })
			.then(commande => {
				if (commande && commande.composants && commande.composants.length > 0) {
					let composants = commande.composants.map(composant => {
						composant.shema = url.resolve(
							assetsDomain,
                            `${settings.assetServer.composantUploadPath}/${commande._id}/${composant.shema}`
                        );
                        composant.image = url.resolve(
							assetsDomain,
                            `${settings.assetServer.composantUploadPath}/${commande._id}/${composant.image}`
						);
						return composant;
					});

					return composants;
				} else {
					return [];
				}
			})
		
    }
    
    getErrorMessage(err) {
        return { status: false, message: err.toString() };
    }

    async uploadComposant(req, res) {
        const { commandeId } = req.params;
        
        if (!ObjectID.isValid(commandeId)) {
          res.send({status:false,message:"Invalid identifier"});
          return;
        }

        const commandeObjectID = new ObjectID(commandeId);

        let form = new formidable.IncomingForm();
    
        form.parse(req, async(err, fields, files) =>{
    
            if(err){
                res.send({ status: false, message: err.toString() });
            }

            if(files==null || !files || Object.keys(files).length ===0){
                res.send({ status: false, message: "No file were uploaded"});
            }

            if(!Object.keys(files).includes("shema") || !Object.keys(files).includes("image")){
                res.send({ status: false, message: "shema && image empty"});
            }

            if(files.shema&&files.shema.size == 0){
                res.send({ status: false, message: "shema empty"});
            }

            if(files.shema&&files.shema.size == 0){
                res.send({ status: false, message: "image empty"});
            }

            //get url upload && create folder
            const BaseAssetPath = `${settings.assetServer.localBasePath}`;
            const dir = `${settings.assetServer.composantUploadPath}/${commandeId}`;
            const uploadDir = `${BaseAssetPath}/${dir}`
            fse.ensureDirSync(uploadDir);
         
            //get name && path file
                var image=files.image
                var shema=files.shema
            //correct file name
                var image_name = utils.getCorrectFileName(image.name);
                var image_path = `${uploadDir}/${image_name}`;
                var shema_name = utils.getCorrectFileName(shema.name);
                var shema_path = `${uploadDir}/${shema_name}`;

            //upload files
            fse.writeFile(image_path,image_path, function(err){ 
                if(err)
                res.send({ status: false, message: "upload error"});
            }) 

            fse.writeFile(shema_path,shema_path, function(err){ 
                if(err)
                res.send({ status: false, message: "upload error"});
            }) 

            //add BDD    
            const composantData = {
                id: new ObjectID(),
                shema:shema_name,
                image :image_name
            };


            await db.collection('commandeInsetion').updateOne(
                {
                    _id: commandeObjectID
                },
                {
                    $push: { composants: composantData }
                }
            );

            const data = await this.getcomposants(commandeId)

            res.send({status: true,data:data});
       
         });
        
    }

    deletecomposant(commandeId, composantId) {
		if (!ObjectID.isValid(commandeId) || !ObjectID.isValid(composantId)) {
			return {status:false,message:"Invalid identifier"}
		}
		let commandeObjectID = new ObjectID(commandeId);
		let composantObjectID = new ObjectID(composantId);

		return this.getcomposants(commandeId)
			.then(async composants => {
				if (composants && composants.length > 0) {
					let composantData = composants.find(
						i => i.id.toString() === composantId.toString()
					);
					if (composantData) {
                        const assetsDomain = settings.assetServer.domain;

						let shema_name = composantData.shema;
						let shema_path = url.resolve(
                            assetsDomain,
							settings.assetServer.composantUploadPath + '/' + commandeId + '/' + shema_name
                        );
                        //fse.removeSync(shema_path);

                        let image_name = composantData.image;
						let image_path = url.resolve(
                            assetsDomain,
							settings.assetServer.composantUploadPath + '/' + commandeId + '/' + image_name
                        );
                        //fse.removeSync(image_path);
                        
						 db
							.collection('commandeInsetion')
							.updateOne(
								{ _id: commandeObjectID },
								{ $pull: { composants: { id: composantObjectID } } }
                            );
                        return await this.getcomposants(commandeId)
					} else {
						return {status: false};
					}
				} else {
					return {status: false};
				}
			})
			.then(async() =>  {return await this.getcomposants(commandeId)});
    }
    
    

}

export default new InsertionService();
