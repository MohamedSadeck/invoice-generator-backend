const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

// Create a new invoice
const createInvoice = async (req, res) => {
    try {
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
            status
        } = req.body;

        // Calculate totals
        let subTotal = 0;
        let taxTotal = 0;

        const processedItems = items.map(item => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = (itemTotal * (item.taxPercent || 0)) / 100;
            
            subTotal += itemTotal;
            taxTotal += itemTax;

            return {
                ...item,
                total: itemTotal + itemTax
            };
        });

        const total = subTotal + taxTotal;

        const invoice = new Invoice({
            user: req.user._id,
            invoiceNumber,
            invoiceDate: invoiceDate || Date.now(),
            dueDate,
            billFrom,
            billTo,
            items: processedItems,
            notes,
            paymentTerms: paymentTerms || 'Net 15',
            status: status || 'Unpaid',
            subTotal,
            taxTotal,
            total
        });

        await invoice.save();

        logger.info(`Invoice created: ${invoice.invoiceNumber} by user: ${req.user._id}`);
        
        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: invoice
        });
    } catch (error) {
        logger.error(`Error creating invoice: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to create invoice',
            error: error.message
        });
    }
};

// Get all invoices for the authenticated user
const getInvoices = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

        const query = { user: req.user._id };
        
        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        const sortOrder = order === 'asc' ? 1 : -1;

        const invoices = await Invoice.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name email');

        const total = await Invoice.countDocuments(query);

        logger.info(`Fetched ${invoices.length} invoices for user: ${req.user._id}`);

        res.status(200).json({
            success: true,
            message: 'Invoices retrieved successfully',
            data: invoices,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error(`Error fetching invoices: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve invoices',
            error: error.message
        });
    }
};

// Get a single invoice by ID
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id).populate('user', 'name email');

        if (!invoice) {
            logger.warn(`Invoice not found: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Check if the invoice belongs to the authenticated user
        if (invoice.user._id.toString() !== req.user._id.toString()) {
            logger.warn(`Unauthorized access attempt to invoice: ${id} by user: ${req.user._id}`);
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to this invoice'
            });
        }

        logger.info(`Invoice retrieved: ${id} by user: ${req.user._id}`);

        res.status(200).json({
            success: true,
            message: 'Invoice retrieved successfully',
            data: invoice
        });
    } catch (error) {
        logger.error(`Error fetching invoice: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve invoice',
            error: error.message
        });
    }
};

// Update an invoice
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            invoiceNumber,
            invoiceDate,
            dueDate,
            billFrom,
            billTo,
            items,
            notes,
            paymentTerms,
            status
        } = req.body;

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            logger.warn(`Invoice not found for update: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Check if the invoice belongs to the authenticated user
        if (invoice.user.toString() !== req.user._id.toString()) {
            logger.warn(`Unauthorized update attempt to invoice: ${id} by user: ${req.user._id}`);
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this invoice'
            });
        }

        // Recalculate totals if items are being updated
        if (items) {
            let subTotal = 0;
            let taxTotal = 0;

            const processedItems = items.map(item => {
                const itemTotal = item.quantity * item.unitPrice;
                const itemTax = (itemTotal * (item.taxPercent || 0)) / 100;
                
                subTotal += itemTotal;
                taxTotal += itemTax;

                return {
                    ...item,
                    total: itemTotal + itemTax
                };
            });

            invoice.items = processedItems;
            invoice.subTotal = subTotal;
            invoice.taxTotal = taxTotal;
            invoice.total = subTotal + taxTotal;
        }

        // Update other fields
        if (invoiceNumber) invoice.invoiceNumber = invoiceNumber;
        if (invoiceDate) invoice.invoiceDate = invoiceDate;
        if (dueDate) invoice.dueDate = dueDate;
        if (billFrom) invoice.billFrom = billFrom;
        if (billTo) invoice.billTo = billTo;
        if (notes !== undefined) invoice.notes = notes;
        if (paymentTerms) invoice.paymentTerms = paymentTerms;
        if (status) invoice.status = status;

        await invoice.save();

        logger.info(`Invoice updated: ${id} by user: ${req.user._id}`);

        res.status(200).json({
            success: true,
            message: 'Invoice updated successfully',
            data: invoice
        });
    } catch (error) {
        logger.error(`Error updating invoice: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to update invoice',
            error: error.message
        });
    }
};

// Delete an invoice
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            logger.warn(`Invoice not found for deletion: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Check if the invoice belongs to the authenticated user
        if (invoice.user.toString() !== req.user._id.toString()) {
            logger.warn(`Unauthorized delete attempt to invoice: ${id} by user: ${req.user._id}`);
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this invoice'
            });
        }

        await Invoice.findByIdAndDelete(id);

        logger.info(`Invoice deleted: ${id} by user: ${req.user._id}`);

        res.status(200).json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        logger.error(`Error deleting invoice: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to delete invoice',
            error: error.message
        });
    }
};

module.exports = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice
};