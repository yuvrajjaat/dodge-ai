const TABLE_SCHEMAS = [
  {
    name: 'sales_order_headers',
    folder: 'sales_order_headers',
    sql: `CREATE TABLE IF NOT EXISTS sales_order_headers (
      salesOrder TEXT, salesOrderType TEXT, salesOrganization TEXT,
      distributionChannel TEXT, organizationDivision TEXT, salesGroup TEXT,
      salesOffice TEXT, soldToParty TEXT, creationDate TEXT, createdByUser TEXT,
      lastChangeDateTime TEXT, totalNetAmount TEXT, overallDeliveryStatus TEXT,
      overallOrdReltdBillgStatus TEXT, overallSdDocReferenceStatus TEXT,
      transactionCurrency TEXT, pricingDate TEXT, requestedDeliveryDate TEXT,
      headerBillingBlockReason TEXT, deliveryBlockReason TEXT,
      incotermsClassification TEXT, incotermsLocation1 TEXT,
      customerPaymentTerms TEXT, totalCreditCheckStatus TEXT
    )`,
  },
  {
    name: 'sales_order_items',
    folder: 'sales_order_items',
    sql: `CREATE TABLE IF NOT EXISTS sales_order_items (
      salesOrder TEXT, salesOrderItem TEXT, salesOrderItemCategory TEXT,
      material TEXT, requestedQuantity TEXT, requestedQuantityUnit TEXT,
      transactionCurrency TEXT, netAmount TEXT, materialGroup TEXT,
      productionPlant TEXT, storageLocation TEXT, salesDocumentRjcnReason TEXT,
      itemBillingBlockReason TEXT
    )`,
  },
  {
    name: 'sales_order_schedule_lines',
    folder: 'sales_order_schedule_lines',
    sql: `CREATE TABLE IF NOT EXISTS sales_order_schedule_lines (
      salesOrder TEXT, salesOrderItem TEXT, scheduleLine TEXT,
      confirmedDeliveryDate TEXT, orderQuantityUnit TEXT,
      confdOrderQtyByMatlAvailCheck TEXT
    )`,
  },
  {
    name: 'outbound_delivery_headers',
    folder: 'outbound_delivery_headers',
    sql: `CREATE TABLE IF NOT EXISTS outbound_delivery_headers (
      actualGoodsMovementDate TEXT, actualGoodsMovementTime TEXT,
      creationDate TEXT, creationTime TEXT, deliveryBlockReason TEXT,
      deliveryDocument TEXT, hdrGeneralIncompletionStatus TEXT,
      headerBillingBlockReason TEXT, lastChangeDate TEXT,
      overallGoodsMovementStatus TEXT, overallPickingStatus TEXT,
      overallProofOfDeliveryStatus TEXT, shippingPoint TEXT
    )`,
  },
  {
    name: 'outbound_delivery_items',
    folder: 'outbound_delivery_items',
    sql: `CREATE TABLE IF NOT EXISTS outbound_delivery_items (
      actualDeliveryQuantity TEXT, batch TEXT, deliveryDocument TEXT,
      deliveryDocumentItem TEXT, deliveryQuantityUnit TEXT,
      itemBillingBlockReason TEXT, lastChangeDate TEXT, plant TEXT,
      referenceSdDocument TEXT, referenceSdDocumentItem TEXT,
      storageLocation TEXT
    )`,
  },
  {
    name: 'billing_document_headers',
    folder: 'billing_document_headers',
    sql: `CREATE TABLE IF NOT EXISTS billing_document_headers (
      billingDocument TEXT, billingDocumentType TEXT, creationDate TEXT,
      creationTime TEXT, lastChangeDateTime TEXT, billingDocumentDate TEXT,
      billingDocumentIsCancelled TEXT, cancelledBillingDocument TEXT,
      totalNetAmount TEXT, transactionCurrency TEXT, companyCode TEXT,
      fiscalYear TEXT, accountingDocument TEXT, soldToParty TEXT
    )`,
  },
  {
    name: 'billing_document_items',
    folder: 'billing_document_items',
    sql: `CREATE TABLE IF NOT EXISTS billing_document_items (
      billingDocument TEXT, billingDocumentItem TEXT, material TEXT,
      billingQuantity TEXT, billingQuantityUnit TEXT, netAmount TEXT,
      transactionCurrency TEXT, referenceSdDocument TEXT,
      referenceSdDocumentItem TEXT
    )`,
  },
  {
    name: 'billing_document_cancellations',
    folder: 'billing_document_cancellations',
    sql: `CREATE TABLE IF NOT EXISTS billing_document_cancellations (
      billingDocument TEXT, billingDocumentType TEXT, creationDate TEXT,
      creationTime TEXT, lastChangeDateTime TEXT, billingDocumentDate TEXT,
      billingDocumentIsCancelled TEXT, cancelledBillingDocument TEXT,
      totalNetAmount TEXT, transactionCurrency TEXT, companyCode TEXT,
      fiscalYear TEXT, accountingDocument TEXT, soldToParty TEXT
    )`,
  },
  {
    name: 'payments_accounts_receivable',
    folder: 'payments_accounts_receivable',
    sql: `CREATE TABLE IF NOT EXISTS payments_accounts_receivable (
      companyCode TEXT, fiscalYear TEXT, accountingDocument TEXT,
      accountingDocumentItem TEXT, clearingDate TEXT,
      clearingAccountingDocument TEXT, clearingDocFiscalYear TEXT,
      amountInTransactionCurrency TEXT, transactionCurrency TEXT,
      amountInCompanyCodeCurrency TEXT, companyCodeCurrency TEXT,
      customer TEXT, invoiceReference TEXT, invoiceReferenceFiscalYear TEXT,
      salesDocument TEXT, salesDocumentItem TEXT, postingDate TEXT,
      documentDate TEXT, assignmentReference TEXT, glAccount TEXT,
      financialAccountType TEXT, profitCenter TEXT, costCenter TEXT
    )`,
  },
  {
    name: 'journal_entry_items_accounts_receivable',
    folder: 'journal_entry_items_accounts_receivable',
    sql: `CREATE TABLE IF NOT EXISTS journal_entry_items_accounts_receivable (
      companyCode TEXT, fiscalYear TEXT, accountingDocument TEXT,
      glAccount TEXT, referenceDocument TEXT, costCenter TEXT,
      profitCenter TEXT, transactionCurrency TEXT,
      amountInTransactionCurrency TEXT, companyCodeCurrency TEXT,
      amountInCompanyCodeCurrency TEXT, postingDate TEXT, documentDate TEXT,
      accountingDocumentType TEXT, accountingDocumentItem TEXT,
      assignmentReference TEXT, lastChangeDateTime TEXT, customer TEXT,
      financialAccountType TEXT, clearingDate TEXT,
      clearingAccountingDocument TEXT, clearingDocFiscalYear TEXT
    )`,
  },
  {
    name: 'business_partners',
    folder: 'business_partners',
    sql: `CREATE TABLE IF NOT EXISTS business_partners (
      businessPartner TEXT, customer TEXT, businessPartnerCategory TEXT,
      businessPartnerFullName TEXT, businessPartnerGrouping TEXT,
      businessPartnerName TEXT, correspondenceLanguage TEXT,
      createdByUser TEXT, creationDate TEXT, creationTime TEXT,
      firstName TEXT, formOfAddress TEXT, industry TEXT,
      lastChangeDate TEXT, lastName TEXT, organizationBpName1 TEXT,
      organizationBpName2 TEXT, businessPartnerIsBlocked TEXT,
      isMarkedForArchiving TEXT
    )`,
  },
  {
    name: 'business_partner_addresses',
    folder: 'business_partner_addresses',
    sql: `CREATE TABLE IF NOT EXISTS business_partner_addresses (
      businessPartner TEXT, addressId TEXT, validityStartDate TEXT,
      validityEndDate TEXT, addressUuid TEXT, addressTimeZone TEXT,
      cityName TEXT, country TEXT, poBox TEXT,
      poBoxDeviatingCityName TEXT, poBoxDeviatingCountry TEXT,
      poBoxDeviatingRegion TEXT, poBoxIsWithoutNumber TEXT,
      poBoxLobbyName TEXT, poBoxPostalCode TEXT, postalCode TEXT,
      region TEXT, streetName TEXT, taxJurisdiction TEXT,
      transportZone TEXT
    )`,
  },
  {
    name: 'products',
    folder: 'products',
    sql: `CREATE TABLE IF NOT EXISTS products (
      product TEXT, productType TEXT, crossPlantStatus TEXT,
      crossPlantStatusValidityDate TEXT, creationDate TEXT,
      createdByUser TEXT, lastChangeDate TEXT, lastChangeDateTime TEXT,
      isMarkedForDeletion TEXT, productOldId TEXT, grossWeight TEXT,
      weightUnit TEXT, netWeight TEXT, productGroup TEXT,
      baseUnit TEXT, division TEXT, industrySector TEXT
    )`,
  },
  {
    name: 'product_descriptions',
    folder: 'product_descriptions',
    sql: `CREATE TABLE IF NOT EXISTS product_descriptions (
      product TEXT, language TEXT, productDescription TEXT
    )`,
  },
  {
    name: 'product_plants',
    folder: 'product_plants',
    sql: `CREATE TABLE IF NOT EXISTS product_plants (
      product TEXT, plant TEXT, countryOfOrigin TEXT,
      regionOfOrigin TEXT, productionInvtryManagedLoc TEXT,
      availabilityCheckType TEXT, fiscalYearVariant TEXT,
      profitCenter TEXT, mrpType TEXT
    )`,
  },
  {
    name: 'product_storage_locations',
    folder: 'product_storage_locations',
    sql: `CREATE TABLE IF NOT EXISTS product_storage_locations (
      product TEXT, plant TEXT, storageLocation TEXT,
      physicalInventoryBlockInd TEXT, dateOfLastPostedCntUnRstrcdStk TEXT
    )`,
  },
  {
    name: 'plants',
    folder: 'plants',
    sql: `CREATE TABLE IF NOT EXISTS plants (
      plant TEXT, plantName TEXT, valuationArea TEXT,
      plantCustomer TEXT, plantSupplier TEXT, factoryCalendar TEXT,
      defaultPurchasingOrganization TEXT, salesOrganization TEXT,
      addressId TEXT, plantCategory TEXT, distributionChannel TEXT,
      division TEXT, language TEXT, isMarkedForArchiving TEXT
    )`,
  },
  {
    name: 'customer_company_assignments',
    folder: 'customer_company_assignments',
    sql: `CREATE TABLE IF NOT EXISTS customer_company_assignments (
      customer TEXT, companyCode TEXT, accountingClerk TEXT,
      accountingClerkFaxNumber TEXT, accountingClerkInternetAddress TEXT,
      accountingClerkPhoneNumber TEXT, alternativePayerAccount TEXT,
      paymentBlockingReason TEXT, paymentMethodsList TEXT,
      paymentTerms TEXT, reconciliationAccount TEXT,
      deletionIndicator TEXT, customerAccountGroup TEXT
    )`,
  },
  {
    name: 'customer_sales_area_assignments',
    folder: 'customer_sales_area_assignments',
    sql: `CREATE TABLE IF NOT EXISTS customer_sales_area_assignments (
      customer TEXT, salesOrganization TEXT, distributionChannel TEXT,
      division TEXT, billingIsBlockedForCustomer TEXT,
      completeDeliveryIsDefined TEXT, creditControlArea TEXT,
      currency TEXT, customerPaymentTerms TEXT, deliveryPriority TEXT,
      incotermsClassification TEXT, incotermsLocation1 TEXT,
      salesGroup TEXT, salesOffice TEXT, shippingCondition TEXT,
      slsUnlmtdOvrdelivIsAllwd TEXT, supplyingPlant TEXT,
      salesDistrict TEXT, exchangeRateType TEXT
    )`,
  },
];

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_soh_salesOrder ON sales_order_headers(salesOrder)',
  'CREATE INDEX IF NOT EXISTS idx_soh_soldToParty ON sales_order_headers(soldToParty)',
  'CREATE INDEX IF NOT EXISTS idx_soi_salesOrder ON sales_order_items(salesOrder)',
  'CREATE INDEX IF NOT EXISTS idx_soi_material ON sales_order_items(material)',
  'CREATE INDEX IF NOT EXISTS idx_sosl_salesOrder ON sales_order_schedule_lines(salesOrder)',
  'CREATE INDEX IF NOT EXISTS idx_odh_deliveryDocument ON outbound_delivery_headers(deliveryDocument)',
  'CREATE INDEX IF NOT EXISTS idx_odi_deliveryDocument ON outbound_delivery_items(deliveryDocument)',
  'CREATE INDEX IF NOT EXISTS idx_odi_referenceSdDocument ON outbound_delivery_items(referenceSdDocument)',
  'CREATE INDEX IF NOT EXISTS idx_bdh_billingDocument ON billing_document_headers(billingDocument)',
  'CREATE INDEX IF NOT EXISTS idx_bdh_soldToParty ON billing_document_headers(soldToParty)',
  'CREATE INDEX IF NOT EXISTS idx_bdi_billingDocument ON billing_document_items(billingDocument)',
  'CREATE INDEX IF NOT EXISTS idx_bdi_referenceSdDocument ON billing_document_items(referenceSdDocument)',
  'CREATE INDEX IF NOT EXISTS idx_bp_businessPartner ON business_partners(businessPartner)',
  'CREATE INDEX IF NOT EXISTS idx_bpa_businessPartner ON business_partner_addresses(businessPartner)',
  'CREATE INDEX IF NOT EXISTS idx_par_customer ON payments_accounts_receivable(customer)',
  'CREATE INDEX IF NOT EXISTS idx_par_invoiceReference ON payments_accounts_receivable(invoiceReference)',
  'CREATE INDEX IF NOT EXISTS idx_jei_referenceDocument ON journal_entry_items_accounts_receivable(referenceDocument)',
  'CREATE INDEX IF NOT EXISTS idx_jei_customer ON journal_entry_items_accounts_receivable(customer)',
  'CREATE INDEX IF NOT EXISTS idx_products_product ON products(product)',
  'CREATE INDEX IF NOT EXISTS idx_pd_product ON product_descriptions(product)',
  'CREATE INDEX IF NOT EXISTS idx_pp_product ON product_plants(product)',
  'CREATE INDEX IF NOT EXISTS idx_pp_plant ON product_plants(plant)',
  'CREATE INDEX IF NOT EXISTS idx_plants_plant ON plants(plant)',
  'CREATE INDEX IF NOT EXISTS idx_cca_customer ON customer_company_assignments(customer)',
  'CREATE INDEX IF NOT EXISTS idx_csaa_customer ON customer_sales_area_assignments(customer)',
];

module.exports = { TABLE_SCHEMAS, INDEXES };
