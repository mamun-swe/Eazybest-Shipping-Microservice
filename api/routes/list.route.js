const express = require("express")
const ListRouter = express.Router()
const ListController = require("../controllers/list.controller")

// List routes
ListRouter.get("/area", ListController.AreaList)

module.exports = {
    ListRouter
}