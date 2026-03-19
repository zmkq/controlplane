-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "BundleItem_bundleId_idx" ON "BundleItem"("bundleId");

-- CreateIndex
CREATE INDEX "BundleItem_productId_idx" ON "BundleItem"("productId");

-- CreateIndex
CREATE INDEX "CourierBooking_saleOrderId_idx" ON "CourierBooking"("saleOrderId");

-- CreateIndex
CREATE INDEX "CourierBooking_status_idx" ON "CourierBooking"("status");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "InventoryLot_productId_idx" ON "InventoryLot"("productId");

-- CreateIndex
CREATE INDEX "InventoryLot_expiryDate_idx" ON "InventoryLot"("expiryDate");

-- CreateIndex
CREATE INDEX "Notification_saleOrderId_idx" ON "Notification"("saleOrderId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "OrderExpense_saleOrderId_idx" ON "OrderExpense"("saleOrderId");

-- CreateIndex
CREATE INDEX "OwnerStatement_periodId_idx" ON "OwnerStatement"("periodId");

-- CreateIndex
CREATE INDEX "OwnerStatement_ownerId_idx" ON "OwnerStatement"("ownerId");

-- CreateIndex
CREATE INDEX "PeriodClose_closedById_idx" ON "PeriodClose"("closedById");

-- CreateIndex
CREATE INDEX "PricingRule_productId_idx" ON "PricingRule"("productId");

-- CreateIndex
CREATE INDEX "PricingRule_brand_idx" ON "PricingRule"("brand");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "QRScanSession_deviceId_idx" ON "QRScanSession"("deviceId");

-- CreateIndex
CREATE INDEX "Refund_saleOrderId_idx" ON "Refund"("saleOrderId");

-- CreateIndex
CREATE INDEX "SaleOrder_status_idx" ON "SaleOrder"("status");

-- CreateIndex
CREATE INDEX "SaleOrder_date_idx" ON "SaleOrder"("date");

-- CreateIndex
CREATE INDEX "SaleOrder_customerId_idx" ON "SaleOrder"("customerId");

-- CreateIndex
CREATE INDEX "SaleOrder_partnerId_idx" ON "SaleOrder"("partnerId");

-- CreateIndex
CREATE INDEX "SaleOrder_fulfillmentMode_idx" ON "SaleOrder"("fulfillmentMode");

-- CreateIndex
CREATE INDEX "SaleOrder_channel_idx" ON "SaleOrder"("channel");

-- CreateIndex
CREATE INDEX "SaleOrderLine_saleOrderId_idx" ON "SaleOrderLine"("saleOrderId");

-- CreateIndex
CREATE INDEX "SaleOrderLine_productId_idx" ON "SaleOrderLine"("productId");

-- CreateIndex
CREATE INDEX "SupplierPO_supplierId_idx" ON "SupplierPO"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPO_status_idx" ON "SupplierPO"("status");

-- CreateIndex
CREATE INDEX "SupplierPO_saleOrderId_idx" ON "SupplierPO"("saleOrderId");

-- CreateIndex
CREATE INDEX "SupplierPOLine_supplierPOId_idx" ON "SupplierPOLine"("supplierPOId");

-- CreateIndex
CREATE INDEX "SupplierPOLine_productId_idx" ON "SupplierPOLine"("productId");

-- CreateIndex
CREATE INDEX "SupplierProduct_productId_idx" ON "SupplierProduct"("productId");

-- CreateIndex
CREATE INDEX "SupplierProduct_supplierId_idx" ON "SupplierProduct"("supplierId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
