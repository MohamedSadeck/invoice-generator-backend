const { GoogleGenAI } = require('@google/genai')
const Invoice = require('../models/Invoice');

const logger = require('../utils/logger');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const parseTextFromInvoice = async (req, res) => {
    const { text } = req.body || {};
    try {
        const prompt = `
            You are an expert invoice data extraction AI. Analyze the following text and extract the relevant information to create an invoice.
            The output MUST be a valid JSON object with the following fields:
            {
                "clientName": "string",
                "email": "string(if available)",
                "address": "string(if available)",
                "items": [
                    {
                        "name": "string",
                        "quantity": number,
                        "unitPrice": number
                    }
                ]
            }
            Here is the text to parse: 
            --- TEXT START ---
            ${text}
            --- TEXT END ---
            Extract the data and provide only the JSON object as specified.
        `

        const model = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-pro';
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });

        logger.info('AI response received for parseTextFromInvoice');

        // response.text may be a string or a function that returns a string
        let responseText = '';
        if (!response) throw new Error('No response from AI model');
        if (typeof response.text === 'string') {
            responseText = response.text;
        } else if (typeof response.text === 'function') {
            responseText = response.text();
        } else if (typeof response === 'string') {
            responseText = response;
        } else {
            // Fallback: try to stringify
            responseText = JSON.stringify(response);
        }

        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedData;
        try {
            parsedData = JSON.parse(cleanedJson);
        } catch (parseErr) {
            logger.error('Failed to parse JSON from AI response', { parseError: parseErr.message, raw: cleanedJson });
            return res.status(422).json({ success: false, message: 'Unable to parse AI response as JSON' });
        }

        logger.info('Text parsed from invoice successfully', { parsedData });

        return res.status(200).json({
            success: true,
            data: parsedData
        });

    } catch (error) {
        // use logger.logError to include request metadata when available
        logger.logError(error, req);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

const generateReminderEmail = async (req, res) => {
    try {
        const { invoiceId } = req.body || {};
        if (!invoiceId) return res.status(400).json({ success: false, message: 'invoiceId is required' });

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

        const prompt = `
            You are a professional and polite accounting assistant. Write a friendly reminder email to a client about an overdue or upcoming invoice payment. 
            Use the following details to personalize the email:
            - Client Name: ${invoice.billTo.clientName}
            - Invoice Number: ${invoice.invoiceNumber}
            - Amount Due: ${invoice.total.toFixed(2)}
            - Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

            The tone should be friendly but clear. Keep it concise. Start the email with "Subject:".
        `

        const response = await ai.models.generateContent({
            model: process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash',
            contents: prompt
        })
        logger.info('Generated reminder email', { invoiceId: invoice._id, clientEmail: invoice.email });

        return res.status(200).json({ success: true, data: { to: invoice.email, subject: `Reminder: Invoice ${invoice._id}`, body: response.text } });

    } catch (error) {
        logger.logError(error, req);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
}

const getDashboardSummary = async (req, res) => {
    try {
        // basic summary: count of invoices and total outstanding amount
        const invoices = await Invoice.find({});
        const total = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
        const outstanding = invoices.filter(i => !i.paid).reduce((acc, inv) => acc + (inv.total || 0), 0);

        const summary = {
            invoiceCount: invoices.length,
            totalAmount: total,
            outstandingAmount: outstanding
        };

        logger.info('Dashboard summary generated', { summary });

        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        logger.logError(error, req);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
}

module.exports = {
    parseTextFromInvoice,
    generateReminderEmail,
    getDashboardSummary
};