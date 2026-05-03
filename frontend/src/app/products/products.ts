import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../shared/services/product.service';
import { CategoryService } from '../shared/services/category.service';
import { BrandService } from '../shared/services/brand.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.scss'],
})
export class ProductsComponent implements OnInit {
  searchQuery = signal<string>('');
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  dismissedAlert = signal<boolean>(false);  // ✅ track if user dismissed alert

  formProduct: Product = { id: 0, name: '', categoryId: 0, brandId: 0, price: 0, stock: 0 };

  enrichedProducts = computed(() => {
    const products = this.productService.products();
    const categories = this.categoryService.categories();
    const brands = this.brandService.brands();
    return products.map(p => ({
      ...p,
      category: categories.find(c => c.id === Number(p.categoryId))?.name || 'Unknown',
      brand: brands.find(b => b.id === Number(p.brandId))?.name || 'Unknown',
    }));
  });

  filteredProducts = computed(() => {
    const products = this.enrichedProducts();
    const query = this.searchQuery().toLowerCase();
    if (!query) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query)
    );
  });

  outOfStockProductsCount = computed(() =>
    this.enrichedProducts().filter(p => p.stock === 0).length
  );

  // ✅ Products with stock < 3
  lowStockProducts = computed(() =>
    this.enrichedProducts().filter(p => p.stock > 0 && p.stock < 3)
  );

  // ✅ Show alert only if there are low stock products and user hasn't dismissed
  showLowStockAlert = computed(() =>
    !this.dismissedAlert() && this.lowStockProducts().length > 0
  );

  constructor(
    public productService: ProductService,
    public categoryService: CategoryService,
    public brandService: BrandService
  ) {}

  ngOnInit(): void {}

  dismissAlert() {
    this.dismissedAlert.set(true);
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
  }

  openAddModal() {
    this.isEditing.set(false);
    this.formProduct = { id: 0, name: '', categoryId: 0, brandId: 0, price: 0, stock: 0 };
    this.showModal.set(true);
  }

  openEditModal(product: Product) {
    this.isEditing.set(true);
    this.formProduct = { ...product };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveProduct() {
    if (this.isEditing()) {
      this.productService.updateProduct(this.formProduct).subscribe(() => {
        this.closeModal();
      });
    } else {
      const { id, ...productWithoutId } = this.formProduct as any;
      this.productService.addProduct(productWithoutId).subscribe(() => {
        this.closeModal();
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe();
    }
  }

  trackByProductId(index: number, product: Product) {
    return product.id;
  }
}