const express = require("express");

const router = express.Router();

const path = require('path');
const shopAdminProducts = require('../Controllers/shopAdmin')

const Auth = require('../Auth');

router.get('/admin/add-products', Auth.auth, shopAdminProducts.getAddProducts);
router.post('/admin/add-products', shopAdminProducts.postAddProducts);


module.exports = router;