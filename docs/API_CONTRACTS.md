# Supermart Management System - API Contracts

## Base URL

Development:

```text
http://localhost:5000/api
```

---

## Standard Success Response

All successful API responses should follow this structure:

```json
{
  "success": true,
  "data": {}
}
```

Example:

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Coca Cola 500ml"
  }
}
```

---

## Standard Error Response

All API errors should follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable error message"
  }
}
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product was not found"
  }
}
```

---

## API Naming Rules

- Use plural resource names.
- Use REST-style routes where practical.
- Use JSON for request and response bodies.
- Backend handles business logic.
- Frontend must not directly modify database tables.
- Authentication and authorization must be enforced on the backend.
- Sensitive operations must create audit log records.
- Route names should remain consistent across the project.
- HTTP status codes should be used correctly.

---

## Initial Route Groups

```text
/api/auth
/api/users
/api/employees
/api/products
/api/categories
/api/brands
/api/inventory
/api/suppliers
/api/purchase-orders
/api/customers
/api/sales
/api/returns
/api/promotions
/api/expenses
/api/wastage
/api/reports
/api/settings
/api/audit
```

---

## Product Routes

```text
GET    /api/products
GET    /api/products/:id
GET    /api/products/barcode/:barcode
POST   /api/products
PATCH  /api/products/:id
```

Purpose:

- List products
- Get single product
- Search product by barcode
- Create product
- Update product

Products with transaction history should normally be archived instead of permanently deleted.

---

## Category Routes

```text
GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
```

---

## Brand Routes

```text
GET    /api/brands
POST   /api/brands
PATCH  /api/brands/:id
```

---

## Inventory Routes

```text
GET    /api/inventory
GET    /api/inventory/low-stock
GET    /api/inventory/expiring
GET    /api/inventory/movements
POST   /api/inventory/adjustments
```

Important:

- Every stock change must create an inventory movement.
- Stock changes must not be performed directly from the frontend.
- Expiry tracking will use inventory batches.

---

## Supplier Routes

```text
GET    /api/suppliers
GET    /api/suppliers/:id
POST   /api/suppliers
PATCH  /api/suppliers/:id
```

---

## Purchase Order Routes

```text
GET    /api/purchase-orders
GET    /api/purchase-orders/:id
POST   /api/purchase-orders
PATCH  /api/purchase-orders/:id
POST   /api/purchase-orders/:id/receive
```

Purchase orders must support:

```text
PENDING
PARTIALLY_RECEIVED
FULLY_RECEIVED
```

Receiving stock must update inventory through the backend.

---

## Customer Routes

```text
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PATCH  /api/customers/:id
```

Customer selection may be optional during a normal walk-in sale.

---

## Sales Routes

```text
POST   /api/sales
GET    /api/sales
GET    /api/sales/:id
```

Creating a sale must handle:

```text
Sale
Sale Items
Payments
Inventory Reduction
Inventory Movements
Audit Log
```

These operations should execute as one atomic transaction.

---

## Return Routes

```text
POST   /api/returns
GET    /api/returns
GET    /api/returns/:id
```

Important:

- Return quantity cannot exceed the originally sold quantity.
- Returned items must be classified as restockable or non-sellable.
- Restockable returns increase inventory.
- Damaged returns must not automatically become sellable stock.

---

## Promotion Routes

```text
GET    /api/promotions
POST   /api/promotions
PATCH  /api/promotions/:id
```

Initial promotion types:

```text
PERCENTAGE
FIXED
```

Complex promotions such as Buy-One-Get-One can be added later if required.

---

## Employee Routes

```text
GET    /api/employees
GET    /api/employees/:id
POST   /api/employees
PATCH  /api/employees/:id
```

Employees should normally be deactivated instead of permanently deleted.

---

## Attendance Routes

```text
POST   /api/employees/:id/clock-in
POST   /api/employees/:id/clock-out
GET    /api/employees/:id/attendance
```

---

## Expense Routes

```text
GET    /api/expenses
POST   /api/expenses
PATCH  /api/expenses/:id
```

---

## Wastage Routes

```text
GET    /api/wastage
POST   /api/wastage
```

Wastage reasons may include:

```text
EXPIRED
DAMAGED
THEFT
SPOILAGE
OTHER
```

Every wastage record must update inventory through an inventory movement.

---

## Report Routes

```text
GET    /api/reports/sales
GET    /api/reports/purchases
GET    /api/reports/inventory
GET    /api/reports/profit
GET    /api/reports/expenses
GET    /api/reports/wastage
GET    /api/reports/employees
```

Reports must only read operational data.

Reports must never modify transactional records.

---

## Settings Routes

```text
GET    /api/settings
PATCH  /api/settings
```

Settings may include:

- Shop name
- Address
- Phone
- Logo
- Tax configuration
- Receipt configuration
- Discount policies
- Backup-related configuration

---

## Authentication Routes

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

Authentication and authorization implementation will be finalized before building these routes.

---

## User & Permission Routes

```text
GET    /api/users
POST   /api/users
PATCH  /api/users/:id
GET    /api/roles
GET    /api/permissions
```

Permissions must be enforced by the backend.

Example:

```text
Cashier
- Billing access
- Product viewing

Manager
- Billing
- Discounts
- Returns

Owner/Admin
- Full system access
```

---

## Audit Routes

```text
GET    /api/audit
```

Sensitive activities should create audit records.

Examples:

- Product price changed
- Inventory adjusted
- Sale refunded
- Wastage recorded
- User created
- Permission changed
- Day closed

---

## HTTP Status Code Guidelines

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

---

## Important Implementation Rule

The routes in this document define the initial API structure.

Before implementing each module, the following must be finalized:

- Request schema
- Response schema
- Validation rules
- Authentication requirement
- Permission requirement
- Database transaction behavior
- Audit logging requirement