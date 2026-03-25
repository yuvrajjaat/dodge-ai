/**
 * Reads SAP O2C JSONL data and produces a graph JSON file.
 * Output: public/graph-data.json with { nodes, edges, index }
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../sap-o2c-data');
const OUT_FILE = path.resolve(__dirname, '../public/graph-data.json');

// --- Helpers ---

function readJsonl(folder) {
  const dir = path.join(DATA_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  const records = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try { records.push(JSON.parse(line)); } catch {}
    }
  }
  return records;
}

// --- Load all tables ---
console.log('Loading data...');
const salesOrderHeaders = readJsonl('sales_order_headers');
const salesOrderItems = readJsonl('sales_order_items');
const deliveryHeaders = readJsonl('outbound_delivery_headers');
const deliveryItems = readJsonl('outbound_delivery_items');
const billingHeaders = readJsonl('billing_document_headers');
const billingItems = readJsonl('billing_document_items');
const payments = readJsonl('payments_accounts_receivable');
const journalEntries = readJsonl('journal_entry_items_accounts_receivable');
const businessPartners = readJsonl('business_partners');
const bpAddresses = readJsonl('business_partner_addresses');
const products = readJsonl('products');
const productDescs = readJsonl('product_descriptions');
const plants = readJsonl('plants');

console.log(`Loaded: ${salesOrderHeaders.length} SOs, ${deliveryHeaders.length} deliveries, ${billingHeaders.length} invoices, ${journalEntries.length} journal entries, ${businessPartners.length} BPs, ${products.length} products, ${plants.length} plants`);

// --- Build lookup maps ---
const productDescMap = {};
for (const pd of productDescs) {
  if (pd.language === 'EN') productDescMap[pd.product] = pd.productDescription;
}

const bpAddressMap = {};
for (const addr of bpAddresses) {
  if (!bpAddressMap[addr.businessPartner]) bpAddressMap[addr.businessPartner] = addr;
}

// --- Build nodes ---
const nodes = [];
const nodeSet = new Set();

function addNode(id, type, label, metadata) {
  if (nodeSet.has(id)) return;
  nodeSet.add(id);
  nodes.push({ id, type, label, metadata });
}

// Customers
for (const bp of businessPartners) {
  const id = `customer-${bp.businessPartner}`;
  const name = bp.businessPartnerFullName || bp.organizationBpName1 || bp.businessPartner;
  const addr = bpAddressMap[bp.businessPartner];
  addNode(id, 'Customer', name, {
    businessPartner: bp.businessPartner,
    customer: bp.customer,
    name,
    category: bp.businessPartnerCategory,
    grouping: bp.businessPartnerGrouping,
    blocked: bp.businessPartnerIsBlocked,
    city: addr?.cityName || '',
    region: addr?.region || '',
    country: addr?.country || '',
  });
}

// Plants
for (const p of plants) {
  addNode(`plant-${p.plant}`, 'Plant', p.plantName || p.plant, {
    plant: p.plant,
    name: p.plantName,
    salesOrganization: p.salesOrganization,
  });
}

// Products (only those referenced in sales orders to keep graph manageable)
const usedProducts = new Set();
for (const item of salesOrderItems) {
  if (item.material) usedProducts.add(item.material);
}
for (const p of products) {
  if (!usedProducts.has(p.product)) continue;
  const desc = productDescMap[p.product] || p.product;
  addNode(`product-${p.product}`, 'Product', desc, {
    product: p.product,
    description: desc,
    productType: p.productType,
    productGroup: p.productGroup,
    baseUnit: p.baseUnit,
  });
}

// Sales Orders
for (const so of salesOrderHeaders) {
  addNode(`so-${so.salesOrder}`, 'SalesOrder', `SO ${so.salesOrder}`, {
    salesOrder: so.salesOrder,
    type: so.salesOrderType,
    creationDate: so.creationDate,
    totalNetAmount: so.totalNetAmount,
    currency: so.transactionCurrency,
    deliveryStatus: so.overallDeliveryStatus,
    billingStatus: so.overallOrdReltdBillgStatus,
    paymentTerms: so.customerPaymentTerms,
  });
}

// Deliveries
for (const d of deliveryHeaders) {
  addNode(`del-${d.deliveryDocument}`, 'Delivery', `DEL ${d.deliveryDocument}`, {
    deliveryDocument: d.deliveryDocument,
    creationDate: d.creationDate,
    goodsMovementStatus: d.overallGoodsMovementStatus,
    pickingStatus: d.overallPickingStatus,
    shippingPoint: d.shippingPoint,
    actualGoodsMovementDate: d.actualGoodsMovementDate,
  });
}

// Billing Documents
for (const b of billingHeaders) {
  addNode(`bill-${b.billingDocument}`, 'BillingDocument', `INV ${b.billingDocument}`, {
    billingDocument: b.billingDocument,
    type: b.billingDocumentType,
    date: b.billingDocumentDate,
    totalNetAmount: b.totalNetAmount,
    currency: b.transactionCurrency,
    cancelled: b.billingDocumentIsCancelled,
    accountingDocument: b.accountingDocument,
  });
}

// Payments (from journal entries where referenceDocument links to billing)
// Group journal entries by accountingDocument to create unique payment nodes
const paymentDocs = new Map();
for (const je of journalEntries) {
  const key = `${je.companyCode}-${je.fiscalYear}-${je.accountingDocument}`;
  if (!paymentDocs.has(key)) {
    paymentDocs.set(key, {
      accountingDocument: je.accountingDocument,
      companyCode: je.companyCode,
      fiscalYear: je.fiscalYear,
      documentType: je.accountingDocumentType,
      customer: je.customer,
      postingDate: je.postingDate,
      referenceDocuments: new Set(),
      totalAmount: 0,
      currency: je.transactionCurrency,
      clearingDocument: je.clearingAccountingDocument,
    });
  }
  const doc = paymentDocs.get(key);
  if (je.referenceDocument) doc.referenceDocuments.add(je.referenceDocument);
  doc.totalAmount += parseFloat(je.amountInTransactionCurrency) || 0;
}

for (const [key, doc] of paymentDocs) {
  addNode(`pay-${doc.accountingDocument}`, 'Payment', `ACC ${doc.accountingDocument}`, {
    accountingDocument: doc.accountingDocument,
    companyCode: doc.companyCode,
    fiscalYear: doc.fiscalYear,
    documentType: doc.documentType,
    customer: doc.customer,
    postingDate: doc.postingDate,
    totalAmount: Math.round(doc.totalAmount * 100) / 100,
    currency: doc.currency,
  });
}

// --- Build edges ---
const edges = [];
const edgeSet = new Set();

function addEdge(source, target, label) {
  const key = `${source}->${target}`;
  if (edgeSet.has(key)) return;
  if (!nodeSet.has(source) || !nodeSet.has(target)) return;
  edgeSet.add(key);
  edges.push({ source, target, label });
}

// Customer -> SalesOrder (places)
for (const so of salesOrderHeaders) {
  if (so.soldToParty) {
    addEdge(`customer-${so.soldToParty}`, `so-${so.salesOrder}`, 'places');
  }
}

// SalesOrder -> Product (contains)
for (const item of salesOrderItems) {
  if (item.material) {
    addEdge(`so-${item.salesOrder}`, `product-${item.material}`, 'contains');
  }
}

// SalesOrder -> Plant (ships_from)
const soPlantDone = new Set();
for (const item of salesOrderItems) {
  if (item.productionPlant) {
    const key = `${item.salesOrder}-${item.productionPlant}`;
    if (!soPlantDone.has(key)) {
      soPlantDone.add(key);
      addEdge(`so-${item.salesOrder}`, `plant-${item.productionPlant}`, 'ships_from');
    }
  }
}

// SalesOrder -> Delivery (fulfilled_by)
for (const di of deliveryItems) {
  if (di.referenceSdDocument) {
    addEdge(`so-${di.referenceSdDocument}`, `del-${di.deliveryDocument}`, 'fulfilled_by');
  }
}

// Delivery -> BillingDocument (billed_in)
for (const bi of billingItems) {
  if (bi.referenceSdDocument) {
    addEdge(`del-${bi.referenceSdDocument}`, `bill-${bi.billingDocument}`, 'billed_in');
  }
}

// BillingDocument -> Payment (via journal entries referenceDocument)
for (const [key, doc] of paymentDocs) {
  for (const refDoc of doc.referenceDocuments) {
    if (nodeSet.has(`bill-${refDoc}`)) {
      addEdge(`bill-${refDoc}`, `pay-${doc.accountingDocument}`, 'accounted_in');
    }
  }
}

// Customer -> Payment
for (const [key, doc] of paymentDocs) {
  if (doc.customer) {
    addEdge(`customer-${doc.customer}`, `pay-${doc.accountingDocument}`, 'pays');
  }
}

// Customer -> BillingDocument (billed_to)
for (const b of billingHeaders) {
  if (b.soldToParty) {
    addEdge(`customer-${b.soldToParty}`, `bill-${b.billingDocument}`, 'billed_to');
  }
}

// --- Build adjacency index for fast neighbor lookups ---
const adjacency = {};
for (const edge of edges) {
  if (!adjacency[edge.source]) adjacency[edge.source] = [];
  if (!adjacency[edge.target]) adjacency[edge.target] = [];
  adjacency[edge.source].push({ node: edge.target, label: edge.label, direction: 'out' });
  adjacency[edge.target].push({ node: edge.source, label: edge.label, direction: 'in' });
}

// --- Output ---
const graph = { nodes, edges, adjacency };
fs.writeFileSync(OUT_FILE, JSON.stringify(graph));
console.log(`\nGraph built: ${nodes.length} nodes, ${edges.length} edges`);
console.log('Node types:', [...new Set(nodes.map(n => n.type))].map(t => `${t}: ${nodes.filter(n => n.type === t).length}`).join(', '));
console.log(`Written to ${OUT_FILE}`);
