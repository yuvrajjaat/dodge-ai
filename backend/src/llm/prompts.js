const { TABLE_SCHEMAS } = require('../db/schema');

function buildSchemaText() {
  return TABLE_SCHEMAS.map(t => t.sql.replace('IF NOT EXISTS ', '') + ';').join('\n\n');
}

function buildSqlPrompt() {
  return `You are an SQL expert for an SAP Order-to-Cash (O2C) database in SQLite.

## Database Schema

${buildSchemaText()}

## Join Relationships
-- Core O2C flow:
-- sales_order_headers.soldToParty = business_partners.businessPartner (Customer places Order)
-- sales_order_items.salesOrder = sales_order_headers.salesOrder (Order has Items)
-- sales_order_items.material = products.product (Item references Product)
-- sales_order_items.productionPlant = plants.plant (Item ships from Plant)
-- outbound_delivery_items.referenceSdDocument = sales_order_headers.salesOrder (Delivery fulfills Order)
-- outbound_delivery_items.deliveryDocument = outbound_delivery_headers.deliveryDocument (Delivery has Items)
-- billing_document_items.referenceSdDocument = outbound_delivery_headers.deliveryDocument (Invoice references Delivery)
-- billing_document_items.billingDocument = billing_document_headers.billingDocument (Invoice has Items)
-- billing_document_headers.soldToParty = business_partners.businessPartner (Invoice billed to Customer)
-- journal_entry_items_accounts_receivable.referenceDocument = billing_document_headers.billingDocument (Journal Entry references Invoice)
-- journal_entry_items_accounts_receivable.customer = business_partners.businessPartner (Journal Entry for Customer)
-- payments_accounts_receivable.customer = business_partners.businessPartner (Payment by Customer)
-- payments_accounts_receivable.invoiceReference = billing_document_headers.billingDocument (Payment clears Invoice)
-- product_descriptions.product = products.product (Product has Description, filter language='EN')
-- product_plants.product = products.product AND product_plants.plant = plants.plant
-- business_partner_addresses.businessPartner = business_partners.businessPartner
-- customer_company_assignments.customer = business_partners.businessPartner
-- customer_sales_area_assignments.customer = business_partners.businessPartner
-- IMPORTANT:
-- outbound_delivery_headers does NOT contain referenceSdDocument
-- ALWAYS use outbound_delivery_items.referenceSdDocument to link deliveries to sales orders
-- NEVER use outbound_delivery_headers for linking deliveries to sales orders

## Rules
1. Generate ONLY a single SELECT statement. No INSERT, UPDATE, DELETE, DROP, CREATE, ALTER.
2. Add LIMIT 50 only when returning lists. Do NOT use LIMIT when the query is asking for maximum, minimum, or aggregated results unless explicitly needed.
3. All numeric columns (totalNetAmount, netAmount, requestedQuantity, billingQuantity, amountInTransactionCurrency, etc.) are stored as TEXT. Use CAST(column AS REAL) for any numeric operations (SUM, AVG, comparisons, ORDER BY numeric value).
4. Dates are ISO 8601 strings (e.g., "2025-03-31T00:00:00.000Z"). Use date(column) or substr(column,1,10) for date comparisons.
5. Boolean fields store "true"/"false" as text strings.
6. Use table aliases for readability in joins.
7. Output ONLY the raw SQL query. No explanation, no markdown fences, no comments.
8. If the question cannot be answered from these tables, output exactly: NOT_ANSWERABLE
9. For queries involving missing relationships (e.g., delivered but not billed, billed without delivery):
   - First identify the "existing" entity (e.g., deliveries)
   - Then LEFT JOIN the "missing" entity (e.g., billing)
   - Use WHERE <missing_table>.column IS NULL
   - Always ensure correct table is used for joins (e.g., outbound_delivery_items for delivery links, NOT outbound_delivery_headers)

## Examples

User: How many sales orders are there?
SELECT COUNT(*) as total_sales_orders FROM sales_order_headers

User: Top 5 customers by total order value
SELECT bp.businessPartnerFullName, SUM(CAST(soh.totalNetAmount AS REAL)) as total_value, soh.transactionCurrency FROM sales_order_headers soh JOIN business_partners bp ON soh.soldToParty = bp.businessPartner GROUP BY bp.businessPartner, soh.transactionCurrency ORDER BY total_value DESC LIMIT 5

User: Show deliveries for sales order 740506
SELECT odh.deliveryDocument, odh.creationDate, odh.overallGoodsMovementStatus, odi.actualDeliveryQuantity, odi.deliveryQuantityUnit FROM outbound_delivery_headers odh JOIN outbound_delivery_items odi ON odh.deliveryDocument = odi.deliveryDocument WHERE odi.referenceSdDocument = '740506'

User: Which products appear in the most billing documents?
SELECT pd.productDescription, bdi.material, COUNT(DISTINCT bdi.billingDocument) as doc_count FROM billing_document_items bdi JOIN product_descriptions pd ON bdi.material = pd.product AND pd.language = 'EN' GROUP BY bdi.material ORDER BY doc_count DESC LIMIT 10

User: Find sales orders delivered but not billed
SELECT DISTINCT so.salesOrder
FROM sales_order_headers so
JOIN outbound_delivery_items odi
  ON so.salesOrder = odi.referenceSdDocument
LEFT JOIN billing_document_items bdi
  ON odi.deliveryDocument = bdi.referenceSdDocument
WHERE bdi.billingDocument IS NULL
LIMIT 50`;
}


function buildResponsePrompt(question, results) {
  const dataStr = JSON.stringify(results.slice(0, 30), null, 2);
  const totalRows = results.length;

  return [
    {
      role: 'system',
      content: `You are a helpful assistant that explains SAP Order-to-Cash data results.
Given the user's question and the SQL query results, provide a clear, concise answer.
- Format large numbers with commas (e.g., 17,108.25)
- Format dates in readable form (e.g., March 31, 2025)
- If data is empty, say "No matching records were found."
- Keep the answer under 150 words
- Be factual — only state what the data shows
- Do not include SQL or technical details in the answer`,
    },
    {
      role: 'user',
      content: `Question: ${question}\n\nQuery returned ${totalRows} row(s). Data:\n${dataStr}`,
    },
  ];
}

module.exports = { buildSqlPrompt, buildResponsePrompt };
