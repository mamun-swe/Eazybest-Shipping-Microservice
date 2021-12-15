const express = require("express")
const AdminRouter = express.Router()
const AreaController = require("../controllers/area.controller")
const DistrictController = require("../controllers/district.controller")
const ShippingController = require("../controllers/shipping.controller")

// Area routes
AdminRouter.get("/area", AreaController.Index)
AdminRouter.post("/area", AreaController.Store)
AdminRouter.get("/area/:id", AreaController.Show)
AdminRouter.put("/area/:id", AreaController.Update)
AdminRouter.delete("/area/:id", AreaController.Delete)

// District routes
AdminRouter.get("/district", DistrictController.Index)
AdminRouter.post("/district", DistrictController.Store)
AdminRouter.get("/district/:id", DistrictController.Show)
AdminRouter.put("/district/:id", DistrictController.Update)
AdminRouter.delete("/district/:id", DistrictController.Delete)

// Shipping routes
AdminRouter.get("/shipping", ShippingController.Index)
AdminRouter.post("/shipping", ShippingController.Store)
AdminRouter.get("/shipping/:id", ShippingController.Show)
AdminRouter.put("/shipping/:id", ShippingController.Update)
AdminRouter.delete("/shipping/:id", ShippingController.Delete)

module.exports = { AdminRouter }