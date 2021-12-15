const express = require("express")
const router = express.Router()
const Permission = require("../middleware/permission.middleware")
const AreaController = require("../controllers/area.controller")
const DistrictController = require("../controllers/district.controller")
const ShippingController = require("../controllers/shipping.controller")

// Area routes
router.get("/area", Permission.Admin, AreaController.Index)
router.post("/area", Permission.Admin, AreaController.Store)
router.get("/area/:id", Permission.Admin, AreaController.Show)
router.put("/area/:id", Permission.Admin, AreaController.Update)
router.delete("/area/:id", Permission.Admin, AreaController.Delete)

// District routes
router.get("/district", Permission.Admin, DistrictController.Index)
router.post("/district", Permission.Admin, DistrictController.Store)
router.get("/district/:id", Permission.Admin, DistrictController.Show)
router.put("/district/:id", Permission.Admin, DistrictController.Update)
router.delete("/district/:id", Permission.Admin, DistrictController.Delete)

// Shipping routes
router.get("/shipping", Permission.Admin, ShippingController.Index)
router.post("/shipping", Permission.Admin, ShippingController.Store)
router.get("/shipping/:id", Permission.Admin, ShippingController.Show)
router.put("/shipping/:id", Permission.Admin, ShippingController.Update)
router.delete("/shipping/:id", Permission.Admin, ShippingController.Delete)

module.exports = router