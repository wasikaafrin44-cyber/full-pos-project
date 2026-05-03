import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService, Purchase, PurchaseItem } from '../shared/services/purchase.service';
import { SupplierService, Supplier } from '../shared/services/supplier.service';
import { ProductService, Product } from '../shared/services/product.service';

@Component({
    selector: 'app-purchases',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './purchases.html',
    styleUrl: './purchases.scss',
})
export class PurchasesComponent implements OnInit {
    // Signals for state management
    showModal = signal<boolean>(false);
    currentPurchase = signal<Purchase>({ id: 0, supplierId: 0, date: new Date(), totalAmount: 0, status: 'Pending', items: [] });
    newItem = signal<any>({ productId: 0, productName: '', quantity: 1, purchasePrice: 0 });

    // Computed signals
    enrichedPurchases = computed(() => {
        const purchases = this.purchaseService.purchases();
        const suppliers = this.supplierService.suppliers();

        return purchases.map(p => ({
            ...p,
            supplierName: suppliers.find(s => s.id === Number(p.supplierId))?.name || 'Unknown'
        }));
    });

    constructor(
        public purchaseService: PurchaseService,
        public supplierService: SupplierService,
        public productService: ProductService
    ) { }

    ngOnInit(): void {
    }

    openAddModal() {
        this.currentPurchase.set({
            id: 0,
            supplierId: 0,
            date: new Date(),
            totalAmount: 0,
            status: 'Pending',
            items: []
        });
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
    }

    addItem() {
    const item = this.newItem();
    const products = this.productService.products();

    const productId = Number(item.productId);       // ✅ force number
    const quantity = Number(item.quantity);          // ✅ force number
    const purchasePrice = Number(item.purchasePrice); // ✅ force number

    if (productId > 0 && quantity > 0) {
        const product = products.find(p => p.id === productId);
        if (product) {
            const current = this.currentPurchase();
            const updatedItems = [...current.items, {
                productId: product.id,
                productName: product.name,
                quantity: quantity,
                purchasePrice: purchasePrice
            }];

            const totalAmount = updatedItems.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0);

            this.currentPurchase.set({
                ...current,
                items: updatedItems,
                totalAmount
            });

            this.newItem.set({ productId: 0, productName: '', quantity: 1, purchasePrice: 0 });
        }
    }
}

    removeItem(index: number) {
        const current = this.currentPurchase();
        const updatedItems = [...current.items];
        updatedItems.splice(index, 1);

        const totalAmount = updatedItems.reduce((sum, i) => sum + (i.quantity * i.purchasePrice), 0);

        this.currentPurchase.set({
            ...current,
            items: updatedItems,
            totalAmount
        });
    }

    savePurchase() {
    const purchase = this.currentPurchase();
    const supplierId = Number(purchase.supplierId);

    if (supplierId > 0 && purchase.items.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const purchaseToSave = { ...purchase, supplierId, date: today };

        this.purchaseService.addPurchase(purchaseToSave).subscribe(() => {
            // ✅ Refresh products to reflect updated price and stock
            this.productService.getProducts().subscribe();
            this.closeModal();
        });
    } else {
        alert('Please select a supplier and add at least one item.');
    }
}
    deletePurchase(id: number) {
        if (confirm('Are you sure you want to delete this purchase?')) {
            this.purchaseService.deletePurchase(id).subscribe();
        }
    }
}
