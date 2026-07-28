const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/prescriptions-queue', rbacMiddleware('PHARMACY', 'SUPER_ADMIN'), pharmacyController.getPrescriptionsQueue);
router.get('/inventory', pharmacyController.getInventory);
router.post('/inventory', rbacMiddleware('PHARMACY'), pharmacyController.addMedicine);
router.post('/dispense', rbacMiddleware('PHARMACY'), pharmacyController.dispenseMedicine);

module.exports = router;
