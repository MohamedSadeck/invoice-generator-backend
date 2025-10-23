const logger = require('../utils/logger');

const validateInvoiceItem = (item, index) => {
    const errors = [];

    if (!item.name || item.name.trim() === '') {
        errors.push({ field: `items[${index}].name`, message: 'Item name is required' });
    } else if (item.name.length > 100) {
        errors.push({ field: `items[${index}].name`, message: 'Item name cannot exceed 100 characters' });
    }

    if (item.quantity === undefined || item.quantity === null) {
        errors.push({ field: `items[${index}].quantity`, message: 'Item quantity is required' });
    } else if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push({ field: `items[${index}].quantity`, message: 'Item quantity must be a positive number' });
    } else if (item.quantity > 999999) {
        errors.push({ field: `items[${index}].quantity`, message: 'Item quantity is too large' });
    }

    if (item.unitPrice === undefined || item.unitPrice === null) {
        errors.push({ field: `items[${index}].unitPrice`, message: 'Item unit price is required' });
    } else if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        errors.push({ field: `items[${index}].unitPrice`, message: 'Item unit price must be a non-negative number' });
    } else if (item.unitPrice > 999999999) {
        errors.push({ field: `items[${index}].unitPrice`, message: 'Item unit price is too large' });
    }

    if (item.taxPercent !== undefined && item.taxPercent !== null) {
        if (typeof item.taxPercent !== 'number' || item.taxPercent < 0) {
            errors.push({ field: `items[${index}].taxPercent`, message: 'Tax percent must be a non-negative number' });
        } else if (item.taxPercent > 100) {
            errors.push({ field: `items[${index}].taxPercent`, message: 'Tax percent cannot exceed 100%' });
        }
    }

    if (item.total === undefined || item.total === null) {
        errors.push({ field: `items[${index}].total`, message: 'Item total is required' });
    } else if (typeof item.total !== 'number' || item.total < 0) {
        errors.push({ field: `items[${index}].total`, message: 'Item total must be a non-negative number' });
    }

    return errors;
};

const validateBillFrom = (billFrom) => {
    const errors = [];

    if (!billFrom) {
        errors.push({ field: 'billFrom', message: 'Bill from information is required' });
        return errors;
    }

    // Validate business name (required)
    if (!billFrom.businessName || billFrom.businessName.trim() === '') {
        errors.push({ field: 'billFrom.businessName', message: 'Business name is required' });
    } else if (billFrom.businessName.length > 100) {
        errors.push({ field: 'billFrom.businessName', message: 'Business name cannot exceed 100 characters' });
    }

    // Validate email if provided
    if (billFrom.email && billFrom.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(billFrom.email)) {
            errors.push({ field: 'billFrom.email', message: 'Please provide a valid email address' });
        }
    }

    // Validate phone number if provided
    if (billFrom.phoneNumber && billFrom.phoneNumber.trim() !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(billFrom.phoneNumber)) {
            errors.push({ field: 'billFrom.phoneNumber', message: 'Please provide a valid phone number' });
        }
    }

    // Validate address length
    if (billFrom.address && billFrom.address.length > 300) {
        errors.push({ field: 'billFrom.address', message: 'Address cannot exceed 300 characters' });
    }

    return errors;
};

const validateBillTo = (billTo) => {
    const errors = [];

    if (!billTo) {
        errors.push({ field: 'billTo', message: 'Bill to information is required' });
        return errors;
    }

    // Validate client name (required)
    if (!billTo.clientName || billTo.clientName.trim() === '') {
        errors.push({ field: 'billTo.clientName', message: 'Client name is required' });
    } else if (billTo.clientName.length > 100) {
        errors.push({ field: 'billTo.clientName', message: 'Client name cannot exceed 100 characters' });
    }

    // Validate email if provided
    if (billTo.email && billTo.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(billTo.email)) {
            errors.push({ field: 'billTo.email', message: 'Please provide a valid email address' });
        }
    }

    // Validate phone number if provided
    if (billTo.phoneNumber && billTo.phoneNumber.trim() !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(billTo.phoneNumber)) {
            errors.push({ field: 'billTo.phoneNumber', message: 'Please provide a valid phone number' });
        }
    }

    // Validate address length
    if (billTo.address && billTo.address.length > 300) {
        errors.push({ field: 'billTo.address', message: 'Address cannot exceed 300 characters' });
    }

    return errors;
};

const validateCreateInvoice = (req, res, next) => {
    const { 
        invoiceNumber, 
        invoiceDate, 
        dueDate, 
        billFrom, 
        billTo, 
        items, 
        notes,
        paymentTerms,
        status,
        subTotal,
        taxTotal,
        total
    } = req.body;
    
    logger.debug('Validating create invoice request', { 
        invoiceNumber,
        itemCount: items?.length 
    });
    
    let errors = [];

    // Validate invoice number
    if (!invoiceNumber || invoiceNumber.trim() === '') {
        errors.push({ field: 'invoiceNumber', message: 'Invoice number is required' });
    } else if (invoiceNumber.length > 50) {
        errors.push({ field: 'invoiceNumber', message: 'Invoice number cannot exceed 50 characters' });
    }

    // Validate dates
    if (invoiceDate) {
        const invoiceDateObj = new Date(invoiceDate);
        if (isNaN(invoiceDateObj.getTime())) {
            errors.push({ field: 'invoiceDate', message: 'Invalid invoice date format' });
        }
    }

    if (dueDate) {
        const dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
            errors.push({ field: 'dueDate', message: 'Invalid due date format' });
        } else if (invoiceDate) {
            const invoiceDateObj = new Date(invoiceDate);
            if (dueDateObj < invoiceDateObj) {
                errors.push({ field: 'dueDate', message: 'Due date cannot be before invoice date' });
            }
        }
    }

    // Validate billFrom
    const billFromErrors = validateBillFrom(billFrom);
    errors = errors.concat(billFromErrors);

    // Validate billTo
    const billToErrors = validateBillTo(billTo);
    errors = errors.concat(billToErrors);

    // Validate items
    if (!items || !Array.isArray(items)) {
        errors.push({ field: 'items', message: 'Items array is required' });
    } else if (items.length === 0) {
        errors.push({ field: 'items', message: 'At least one item is required' });
    } else {
        items.forEach((item, index) => {
            const itemErrors = validateInvoiceItem(item, index);
            errors = errors.concat(itemErrors);
        });
    }

    // Validate notes
    if (notes && notes.length > 1000) {
        errors.push({ field: 'notes', message: 'Notes cannot exceed 1000 characters' });
    }

    // Validate payment terms
    if (paymentTerms && paymentTerms.length > 100) {
        errors.push({ field: 'paymentTerms', message: 'Payment terms cannot exceed 100 characters' });
    }

    // Validate status
    if (status && !['Paid', 'Unpaid'].includes(status)) {
        errors.push({ field: 'status', message: 'Status must be either "Paid" or "Unpaid"' });
    }

    // Validate totals
    if (subTotal !== undefined && subTotal !== null) {
        if (typeof subTotal !== 'number' || subTotal < 0) {
            errors.push({ field: 'subTotal', message: 'Subtotal must be a non-negative number' });
        }
    }

    if (taxTotal !== undefined && taxTotal !== null) {
        if (typeof taxTotal !== 'number' || taxTotal < 0) {
            errors.push({ field: 'taxTotal', message: 'Tax total must be a non-negative number' });
        }
    }

    if (total === undefined || total === null) {
        errors.push({ field: 'total', message: 'Total is required' });
    } else if (typeof total !== 'number' || total < 0) {
        errors.push({ field: 'total', message: 'Total must be a non-negative number' });
    }

    if (errors.length > 0) {
        logger.warn('Create invoice validation failed', { 
            invoiceNumber,
            errorCount: errors.length,
            errorFields: errors.map(e => e.field)
        });
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    logger.debug('Create invoice validation passed', { invoiceNumber });
    next();
};

const validateUpdateInvoice = (req, res, next) => {
    const { 
        invoiceNumber, 
        invoiceDate, 
        dueDate, 
        billFrom, 
        billTo, 
        items, 
        notes,
        paymentTerms,
        status,
        subTotal,
        taxTotal,
        total
    } = req.body;
    
    logger.debug('Validating update invoice request', { 
        fields: Object.keys(req.body)
    });
    
    let errors = [];

    // All fields are optional for update, but if provided, they must be valid

    // Validate invoice number if provided
    if (invoiceNumber !== undefined) {
        if (invoiceNumber.trim() === '') {
            errors.push({ field: 'invoiceNumber', message: 'Invoice number cannot be empty' });
        } else if (invoiceNumber.length > 50) {
            errors.push({ field: 'invoiceNumber', message: 'Invoice number cannot exceed 50 characters' });
        }
    }

    // Validate dates if provided
    if (invoiceDate !== undefined) {
        const invoiceDateObj = new Date(invoiceDate);
        if (isNaN(invoiceDateObj.getTime())) {
            errors.push({ field: 'invoiceDate', message: 'Invalid invoice date format' });
        }
    }

    if (dueDate !== undefined) {
        const dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
            errors.push({ field: 'dueDate', message: 'Invalid due date format' });
        }
    }

    // Validate billFrom if provided
    if (billFrom !== undefined) {
        const billFromErrors = validateBillFrom(billFrom);
        errors = errors.concat(billFromErrors);
    }

    // Validate billTo if provided
    if (billTo !== undefined) {
        const billToErrors = validateBillTo(billTo);
        errors = errors.concat(billToErrors);
    }

    // Validate items if provided
    if (items !== undefined) {
        if (!Array.isArray(items)) {
            errors.push({ field: 'items', message: 'Items must be an array' });
        } else if (items.length === 0) {
            errors.push({ field: 'items', message: 'At least one item is required' });
        } else {
            items.forEach((item, index) => {
                const itemErrors = validateInvoiceItem(item, index);
                errors = errors.concat(itemErrors);
            });
        }
    }

    // Validate notes if provided
    if (notes !== undefined && notes.length > 1000) {
        errors.push({ field: 'notes', message: 'Notes cannot exceed 1000 characters' });
    }

    // Validate payment terms if provided
    if (paymentTerms !== undefined && paymentTerms.length > 100) {
        errors.push({ field: 'paymentTerms', message: 'Payment terms cannot exceed 100 characters' });
    }

    // Validate status if provided
    if (status !== undefined && !['Paid', 'Unpaid'].includes(status)) {
        errors.push({ field: 'status', message: 'Status must be either "Paid" or "Unpaid"' });
    }

    // Validate totals if provided
    if (subTotal !== undefined && (typeof subTotal !== 'number' || subTotal < 0)) {
        errors.push({ field: 'subTotal', message: 'Subtotal must be a non-negative number' });
    }

    if (taxTotal !== undefined && (typeof taxTotal !== 'number' || taxTotal < 0)) {
        errors.push({ field: 'taxTotal', message: 'Tax total must be a non-negative number' });
    }

    if (total !== undefined && (typeof total !== 'number' || total < 0)) {
        errors.push({ field: 'total', message: 'Total must be a non-negative number' });
    }

    if (errors.length > 0) {
        logger.warn('Update invoice validation failed', { 
            errorCount: errors.length,
            errorFields: errors.map(e => e.field)
        });
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    logger.debug('Update invoice validation passed');
    next();
};

const validateInvoiceId = (req, res, next) => {
    const { id } = req.params;
    
    logger.debug('Validating invoice ID', { id });
    
    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
        logger.warn('Invalid invoice ID format', { id });
        return res.status(400).json({ 
            success: false,
            message: 'Invalid invoice ID format' 
        });
    }

    logger.debug('Invoice ID validation passed', { id });
    next();
};

module.exports = {
    validateCreateInvoice,
    validateUpdateInvoice,
    validateInvoiceId
};
