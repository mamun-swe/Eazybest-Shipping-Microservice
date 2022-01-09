const express = require("express")
const CustomerRouter = express.Router()
const Cache = require("../cache")
const CustomerController = require("../controllers/customer.controller")

/* Customer routes */
CustomerRouter.get("/districts", Cache.AreaCache, CustomerController.districtList)
CustomerRouter.post("/match-shipping", CustomerController.matchShipping)

module.exports = {
    CustomerRouter
}