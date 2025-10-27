const { GoogleGenAI } = require('@google/genai')
const Invoice = require('../models/Invoice');

const logger = require('../utils/logger');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const parseTextFromInvoice = async (req, res) => {
    const { text } = req.body || {};
    try {
        const prompt = `
You are an expert invoice data extraction AI. Analyze the following text and extract the relevant information to create an invoice.

CRITICAL: Your response MUST be ONLY valid JSON. Do not include any markdown, code blocks, or explanatory text.

Required JSON structure:
{
    "clientName": "string",
    "email": "string or empty string",
    "address": "string or empty string",
    "items": [
        {
            "name": "string",
            "quantity": number,
            "unitPrice": number
        }
    ]
}

Rules:
1. Return ONLY the JSON object, nothing else
2. Do NOT use trailing commas
3. All property names must be in double quotes
4. All string values must be in double quotes
5. Numbers should not be quoted
6. If a field is not available, use empty string "" for text fields
7. Ensure the JSON is properly formatted and parseable

Text to parse:
--- TEXT START ---
${text}
--- TEXT END ---

Return only the JSON object:`;

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

        // Clean the response - remove markdown code blocks and trim
        let cleanedJson = responseText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        // Try to extract JSON object if there's extra text
        const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedJson = jsonMatch[0];
        }

        // Fix common JSON syntax errors
        cleanedJson = cleanedJson
            // Remove trailing commas before closing braces/brackets
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix missing commas between array elements (basic case)
            .replace(/}\s*{/g, '},{')
            // Remove any non-JSON characters before the first {
            .replace(/^[^{]*/, '')
            // Remove any non-JSON characters after the last }
            .replace(/[^}]*$/, '');

        logger.debug('Cleaned JSON response', { cleanedJson: cleanedJson.substring(0, 500) });

        let parsedData;
        try {
            parsedData = JSON.parse(cleanedJson);
        } catch (parseErr) {
            logger.error('Failed to parse JSON from AI response', { 
                parseError: parseErr.message, 
                raw: cleanedJson.substring(0, 1000) 
            });
            
            // Try one more time with a stricter cleanup
            try {
                const strictClean = cleanedJson
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/'/g, '"');
                parsedData = JSON.parse(strictClean);
                logger.info('JSON parsed successfully on second attempt');
            } catch (secondErr) {
                logger.error('Second parse attempt failed', { error: secondErr.message });
                return res.status(422).json({ 
                    success: false, 
                    message: 'Unable to parse AI response as valid JSON. Please try again or rephrase your input.',
                    details: parseErr.message
                });
            }
        }

        // Validate the parsed data structure
        if (!parsedData.clientName || !Array.isArray(parsedData.items)) {
            logger.error('Invalid data structure from AI', { parsedData });
            return res.status(422).json({ 
                success: false, 
                message: 'AI response is missing required fields (clientName or items array)' 
            });
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
        const invoices = await Invoice.find({user: req.user._id});

        if(invoices.length === 0) {
            return res.status(200).json({ success: true, data: { invoiceCount: 0, totalAmount: 0, outstandingAmount: 0 } });
        }

        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
        const unpaidInvoices = invoices.filter(inv => inv.status !== 'Paid');

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

        const dataSummary = `
            - Total number of invoices: ${totalInvoices}
            - Number of paid invoices: ${paidInvoices.length}
            - Number of unpaid/pending invoices: ${unpaidInvoices.length}
            - Total revenue from paid invoices: ${totalRevenue.toFixed(2)}Da
            - Total outstanding amount from unpaid/pending invoices: ${totalOutstanding.toFixed(2)}
            - Recent invoices (last 5): ${invoices.slice(0,5).map(inv => `Invoice #${inv.invoiceNumber} for ${inv.total.toFixed(2)} with status ${inv.status}`).join(',')}
        `;

        const prompt = `
            You are a friendly and insightful financial analyst for a small business owner. 
            Based on the following summary of their invoice data, provide 2-3 and actionable insights.
            Each insight should be a short string in a JSON array.
            The insights should be encouraging and helpful. Do no just repeat the data.
            For example, if there is a high outstanding amount, suggest sending reminders. If revenue is high, be encouraging.

            Data summary: 
            ${dataSummary}

            Return your response as a valid JSON object with a single key "insights" which is an array of strings.
            example format: {"insights": ["Your revenue is looking string this month!","You have 5 overdue invoices, Consider sending reminders to get paid faster"]}
        `;

        const response = await ai.models.generateContent({
            model: process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash',
            contents: prompt
        });

        const responseText = response.text;

        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(cleanedJson);

        res.status(200).json({ 
            success: true, 
            data: {
                invoiceCount: totalInvoices,
                totalRevenue: totalRevenue.toFixed(2),
                totalOutstanding: totalOutstanding.toFixed(2),
                insights: parsedData.insights || []
            }
        });

        logger.info('Dashboard summary generated', { userId: req.user._id, invoiceCount: totalInvoices });
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