const express = require('express');

const { parseTextFromInvoice, generateReminderEmail } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const { validateParseTextFromInvoice } = require('../validators');

const router = express.Router();

router.post("/parse-text", protect, validateParseTextFromInvoice, parseTextFromInvoice);
router.post("/generate-reminder", protect, generateReminderEmail);
// router.get("/dashboard-summary", protect, getDashboardSummary);

module.exports = router;