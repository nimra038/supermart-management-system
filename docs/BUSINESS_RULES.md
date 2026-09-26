# Supermart Management System - Core Business Rules

1. Every product barcode must be unique within the business.

2. Every stock change must create an inventory movement record.

3. Product sale decreases stock automatically.

4. Purchase receiving increases stock automatically.

5. Damage, wastage, theft, or manual adjustment must update stock with a recorded reason.

6. Stock should not become negative unless this behavior is explicitly allowed later.

7. Product price changes must never change historical sale records.

8. Sale items must store their own price and cost snapshot at the time of sale.

9. Expiry date must be tracked per inventory batch, not directly on the product.

10. A return cannot exceed the quantity originally sold.

11. Returned items must be marked either:
   - Restockable
   - Damaged / Non-sellable

12. Completed sales should not be silently edited or deleted.

13. Products with transaction history should be archived instead of permanently deleted.

14. Purchase orders must support:
   - Pending
   - Partially Received
   - Fully Received

15. Checkout operations must be atomic:
   - Create sale
   - Create sale items
   - Record payments
   - Reduce inventory
   - Create stock movements
   - Record audit log

16. Purchase receiving must also be atomic:
   - Record received items
   - Create inventory batches
   - Increase stock
   - Update purchase order status
   - Create stock movements

17. Every sensitive action must record the user who performed it.

18. Owner/Admin has full access.

19. Cashier permissions must be restricted from sensitive actions such as:
   - Changing product prices
   - Managing users
   - Changing system settings

20. Reports must only read operational data and must not modify transactional data.

21. Financial calculations must use database numeric/decimal values, not floating-point values.

22. Employee records should normally be deactivated instead of deleted.

23. The final owner account must not be removable without a controlled ownership transfer process.

24. Day-end closing must preserve a historical summary of the day's activity.

25. Backup and restore procedures must be maintained for production data.