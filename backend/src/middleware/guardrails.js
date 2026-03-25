const BLOCKED_PATTERNS = [
  /\b(DROP|DELETE|INSERT|UPDATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b/i,
  /;\s*--/,
  /UNION\s+SELECT/i,
  /INTO\s+OUTFILE/i,
  /LOAD_FILE/i,
];

const DOMAIN_KEYWORDS = [
  'order', 'sales', 'customer', 'delivery', 'invoice', 'billing', 'payment',
  'product', 'material', 'plant', 'amount', 'revenue', 'ship', 'document',
  'partner', 'outstanding', 'overdue', 'cancel', 'total', 'average', 'count',
  'how many', 'top', 'list', 'show', 'which', 'what', 'who', 'where',
  'status', 'blocked', 'pending', 'credit', 'journal', 'accounting',
  'receivable', 'quantity', 'net', 'gross', 'flow', 'o2c', 'sap',
  'billed', 'delivered', 'paid', 'unpaid', 'cleared', 'profit', 'cost',
  'warehouse', 'storage', 'batch', 'currency', 'inr', 'fiscal',
  'schedule', 'date', 'created', 'recent', 'oldest', 'largest', 'smallest',
  'highest', 'lowest', 'most', 'least', 'sum', 'avg',
];

function checkGuardrails(query) {
  if (!query || typeof query !== 'string') {
    return { allowed: false, message: 'Please provide a valid question.' };
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { allowed: false, message: 'Please provide a question.' };
  }

  if (trimmed.length > 500) {
    return { allowed: false, message: 'Question is too long. Please keep it under 500 characters.' };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, message: 'Your query contains disallowed patterns.' };
    }
  }

  const lower = trimmed.toLowerCase();
  const hasDomainKeyword = DOMAIN_KEYWORDS.some(kw => lower.includes(kw));
  if (!hasDomainKeyword) {
    return {
      allowed: false,
      message: 'I can only answer questions about SAP Order-to-Cash data (sales orders, deliveries, billing, payments, customers, products, etc.).',
    };
  }

  return { allowed: true };
}

module.exports = { checkGuardrails };
