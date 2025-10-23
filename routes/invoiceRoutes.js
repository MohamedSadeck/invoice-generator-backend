const express = require('express');

const { createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

const {validateCreateInvoice, validateInvoiceId, validateUpdateInvoice} = require('../validators');

const router = express.Router();

router.route('/')
    .post(protect, validateCreateInvoice, createInvoice)
    .get(protect, getInvoices);
router.route('/:id')
    .get(protect, validateInvoiceId, getInvoiceById)
    .put(protect, validateInvoiceId, validateUpdateInvoice, updateInvoice)
    .delete(protect, validateInvoiceId, deleteInvoice);

module.exports = router;