const express = require("express")
const AdminRouter = express.Router()
const AreaController = require("../controllers/area.controller")
const DivisionController = require("../controllers/division.controller")
const DistrictController = require("../controllers/district.controller")
const ShippingController = require("../controllers/shipping.controller")

// Area routes
AdminRouter.get("/area", AreaController.Index)
AdminRouter.post("/area", AreaController.Store)
AdminRouter.post("/get-area-by-district", AreaController.getAreaByDistrict)
AdminRouter.get("/area/:id", AreaController.Show)
AdminRouter.put("/area/:id", AreaController.Update)
AdminRouter.delete("/area/:id", AreaController.Delete)

// division routes
AdminRouter.get("/district", DistrictController.Index)
AdminRouter.post("/district", DistrictController.Store)
AdminRouter.get("/district/:id", DistrictController.Show)
AdminRouter.put("/district/:id", DistrictController.Update)
AdminRouter.post("/get-district-by-division", DistrictController.getDistrictByDivision)
AdminRouter.delete("/district/:id", DistrictController.Delete)

// Division routes
AdminRouter.get("/division", DivisionController.Index)
AdminRouter.post("/division", DivisionController.Store)
AdminRouter.get("/division/:id", DivisionController.Show)
AdminRouter.put("/division/:id", DivisionController.Update)
AdminRouter.delete("/division/:id", DivisionController.Delete)

// Shipping routes
AdminRouter.get("/shipping", ShippingController.Index)
AdminRouter.get("/all-shipping-inrange", ShippingController.AllShippingInRange)
AdminRouter.post("/shipping", ShippingController.Store)
AdminRouter.get("/shipping/:id", ShippingController.Show)
AdminRouter.put("/shipping/:id", ShippingController.Update)
AdminRouter.delete("/shipping/:id", ShippingController.Delete)

module.exports = { AdminRouter }