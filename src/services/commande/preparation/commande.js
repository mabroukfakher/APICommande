import { ObjectID } from "mongodb";
import url from "url";
import settings from "../../../lib/settings";
import { db } from "../../../lib/mongo";
import parse from "../../../lib/parse";
import fse from 'fs-extra';
import path from 'path';
import utils from '../../../lib/utils';
import formidable from 'formidable';

class CommandeService {
  getFilter(params = {}) {
    let filter = {}

    const id = parse.getObjectIDIfValid(params.id)
    if (id) {
      filter._id = new ObjectID(id)
    }

    const ordreFabrication = parse.getString(params.ordreFabrication)
    if (ordreFabrication != "") {
      filter.ordreFabrication = ordreFabrication
    }

    return filter
  }

  getCommandes(params) {
    const filter = this.getFilter(params)
    const limit = parse.getNumberIfPositive(params.limit) || 10000
    const offset = parse.getNumberIfPositive(params.offset) || 0
    const domain = settings.assetServer.domain

    return Promise.all([
      db
        .collection("commandePreparation")
        .find(filter)
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection("commandePreparation").countDocuments(filter),
    ]).then(([commandes, commandesCount]) => {
      const items = commandes.map((commande) =>
        this.changeProperties(commande, domain)
      )
      const result = {
        total_count: commandesCount,
        has_more: offset + items.length < commandesCount,
        data: items,
      }
      return result
    })
  }

  changeProperties(item, domain) {
    if (item) {
      item.id = item._id.toString()
      delete item._id

      item = this.getCommandeUrl(item, domain)
    }

    return item
  }

  getCommandeUrl(item, domain) {
    item.shema = url.resolve(
      domain,
      `${settings.assetServer.commandePreparationUploadPath}/${item.shema}`
    )
    item.image = url.resolve(
      domain,
      `${settings.assetServer.commandePreparationUploadPath}/${item.image}`
    )
    return item
  }

  getSingleCommande(id) {
    if (!ObjectID.isValid(id)) {
      return { status: false, message: "Invalid identifier" }
    }
    return this.getCommandes({ id: id, limit: 1 }).then((commandes) =>
      commandes.data.length > 0 ? commandes.data[0] : {}
    )
  }

  async getValidDocumentForInsert(data) {
    let commande = {
      date_created: new Date(),
      date_updated: null,
    }

    commande.ordreFabrication = parse.getString(data.ordreFabrication)
    commande.shema = parse.getString(data.shema)
    commande.image = parse.getString(data.image)
    commande.nbrComposant = parse.getNumberIfPositive(data.nbrComposant) || 0
    commande.dateDebut = parse.getDateIfValid(data.dateDebut)
    commande.ref = parse.getString(data.ref)
    commande.post = parse.getString(data.post)

    return commande
  }

  addCommande(req, res) {
    let form = new formidable.IncomingForm()

    form.parse(req, async (err, fields, files) => {
      //console.log(files)

      if (err) {
        res.send({ status: false, message: err.toString() })
      }

      if (fields == null || !fields || Object.keys(fields).length === 0) {
        res.send({ status: false, message: "Tous les champs obligatoire" })
      }

      if (
        fields.ordreFabrication == null ||
        fields.ordreFabrication === undefined
      ) {
        res.send({ status: false, message: "Prdre de fabrication empty" })
      }

      if (fields.dateDebut == null || fields.dateDebut === undefined) {
        res.send({ status: false, message: "Date Debut empty" })
      }
      if (fields.ref == null || fields.ref === undefined) {
        res.send({ status: false, message: "ref empty" })
      }

      if (files == null || !files || Object.keys(files).length === 0) {
        res.send({ status: false, message: "No file were uploaded" })
      }

      if (
        !Object.keys(files).includes("shema") ||
        !Object.keys(files).includes("image")
      ) {
        res.send({ status: false, message: "shema && image empty" })
      }

      if (files.shema && files.shema.size == 0) {
        res.send({ status: false, message: "shema empty" })
      }

      if (files.shema && files.shema.size == 0) {
        res.send({ status: false, message: "image empty" })
      }

      if (fields.nbrComposant == null || fields.nbrComposant === undefined) {
        res.send({ status: false, message: "Nombre de composant empty" })
      }

      //get url upload && create folder
      const BaseAssetPath = `${settings.assetServer.localBasePath}`
      const dir = `${settings.assetServer.commandePreparationUploadPath}`
      const uploadDir = `${BaseAssetPath}/${dir}`
      fse.ensureDirSync(uploadDir)

      //get name && path file
      var image = files.image
      var shema = files.shema
      //correct file name
      var image_name = utils.getCorrectFileName(image.name)
      var image_path = `${uploadDir}/${image_name}`
      var shema_name = utils.getCorrectFileName(shema.name)
      var shema_path = `${uploadDir}/${shema_name}`

      var oldPath_shema = files.shema.path
      var rawData_shema = fse.readFileSync(oldPath_shema)
      var oldPath_image = files.image.path
      var rawData_image = fse.readFileSync(oldPath_image)

      //upload files
      fse.writeFile(image_path, rawData_image, function (err) {
        if (err) res.send({ status: false, message: "upload error" })
      })

      fse.writeFile(shema_path, rawData_shema, function (err) {
        if (err) res.send({ status: false, message: "upload error" })
      })

      //add BDD
      const filesData = {
        shema: shema_name,
        image: image_name,
      }
      const data = { ...fields, ...filesData }
      return this.getValidDocumentForInsert(data)
        .then((dataToInsert) =>
          db.collection("commandePreparation").insertMany([dataToInsert])
        )
        .then(async (result) => {
          if (result.insertedCount > 0) {
            const commande = await this.getSingleCommande(
              result.ops[0]._id.toString()
            )
            res.send({
              status: true,
              data: commande,
              message: "Vous avez crée une nouvelle commande.",
            })
          }
          res.send({ status: false, data: null, message: "ADD failed" })
        })
    })
  }

  deleteCommande(commandeId) {
    if (!ObjectID.isValid(commandeId)) {
      return { status: false, message: "Invalid identifier" }
    }
    const commandeObjectID = new ObjectID(commandeId)

    // 1. delete Commande
    return db
      .collection("commandePreparation")
      .deleteOne({ _id: commandeObjectID })
      .then((deleteResponse) => {
        return deleteResponse.deletedCount > 0
      })
  }
  getPosts(params) {
    const filter = this.getFilter(params)
    const limit = parse.getNumberIfPositive(params.limit) || 10000
    const offset = parse.getNumberIfPositive(params.offset) || 0
    const domain = settings.assetServer.domain

    return Promise.all([
      db
        .collection("commandePreparation")
        .find(filter)
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection("commandePreparation").countDocuments(filter),
    ]).then(([commandes, commandesCount]) => {
      console.log(
        "%cMyProject%cline:238%ccommandes",
        "color:#fff;background:#ee6f57;padding:3px;border-radius:2px",
        "color:#fff;background:#1f3c88;padding:3px;border-radius:2px",
        "color:#fff;background:rgb(131, 175, 155);padding:3px;border-radius:2px",
        commandes
      )
      const items = commandes.map((commande) =>
        this.changeProperties(commande, domain)
      )
      const result = {
        total_count: commandesCount,
        has_more: offset + items.length < commandesCount,
        data: items,
      }
      return result
    })
  }
}

export default new CommandeService();
