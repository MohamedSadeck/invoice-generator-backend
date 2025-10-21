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

const validateBillInfo = (billInfo, fieldPrefix) => {
    const errors = [];

    if (!billInfo) {
        errors.push({ field: fieldPrefix, message: `${fieldPrefix} information is required` });
        return errors;
    }

    // Validate email if provided
    if (billInfo.email && billInfo.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(billInfo.email)) {
            errors.push({ field: `${fieldPrefix}.email`, message: 'Please provide a valid email address' });
        }
    }

    // Validate phone number if provided
    if (billInfo.phoneNumber && billInfo.phoneNumber.trim() !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(billInfo.phoneNumber)) {
            errors.push({ field: `${fieldPrefix}.phoneNumber`, message: 'Please provide a valid phone number' });
        }
    }

    // Validate field lengths
    if (billInfo.businessName && billInfo.businessName.length > 100) {
        errors.push({ field: `${fieldPrefix}.businessName`, message: 'Business name cannot exceed 100 characters' });
    }
    if (billInfo.clientName && billInfo.clientName.length > 100) {
        errors.push({ field: `${fieldPrefix}.clientName`, message: 'Client name cannot exceed 100 characters' });
    }
    if (billInfo.address && billInfo.address.length > 300) {
        errors.push({ field: `${fieldPrefix}.address`, message: 'Address cannot exceed 300 characters' });
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
    const billFromErrors = validateBillInfo(billFrom, 'billFrom');
    errors = errors.concat(billFromErrors);

    // Validate billTo
    if (!billTo || !billTo.clientName || billTo.clientName.trim() === '') {
        errors.push({ field: 'billTo.clientName', message: 'Client name is required' });
    }
    const billToErrors = validateBillInfo(billTo, 'billTo');
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
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

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
        const billFromErrors = validateBillInfo(billFrom, 'billFrom');
        errors = errors.concat(billFromErrors);
    }

    // Validate billTo if provided
    if (billTo !== undefined) {
        if (billTo.clientName !== undefined && billTo.clientName.trim() === '') {
            errors.push({ field: 'billTo.clientName', message: 'Client name cannot be empty' });
        }
        const billToErrors = validateBillInfo(billTo, 'billTo');
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
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors 
        });
    }

    next();
};

const validateInvoiceId = (req, res, next) => {
    const { id } = req.params;
    
    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'Invalid invoice ID format' 
        });
    }

    next();
};

module.exports = {
    validateCreateInvoice,
    validateUpdateInvoice,
    validateInvoiceId
};
