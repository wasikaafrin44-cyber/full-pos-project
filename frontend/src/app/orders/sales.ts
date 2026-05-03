import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../shared/services/product.service';
import { OrderService, Order } from '../shared/services/order.service';
import { CustomerService, Customer } from '../shared/services/customer.service';
import { CategoryService } from '../shared/services/category.service';
import { DashboardService } from '../dashboard/dashboard.service';

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales.html',
  styles: [`
    .product-card {
      transition: all 0.2s;
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
      }
    }
    .btn-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 8px;
    }
    .mobile-provider-btn {
      transition: all 0.2s;
      border: 2px solid transparent;
    }
    .mobile-provider-btn:hover { transform: translateY(-2px); }
    .mobile-provider-btn.selected { border: 2px solid currentColor; }
    .card-type-btn {
      transition: all 0.2s;
      border: 2px solid transparent;
      cursor: pointer;
    }
    .card-type-btn:hover { transform: translateY(-2px); }
    .card-type-btn.selected { border: 2px solid currentColor; }
    .card-preview {
      background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
      border-radius: 16px;
      padding: 24px;
      color: white;
      font-family: monospace;
      position: relative;
      overflow: hidden;
      min-height: 160px;
    }
    .card-preview::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 160px; height: 160px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .card-preview::after {
      content: '';
      position: absolute;
      bottom: -60px; right: 20px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
    }
    .card-chip {
      width: 40px; height: 30px;
      background: linear-gradient(135deg, #f0c040, #c8960c);
      border-radius: 6px;
      margin-bottom: 16px;
    }
  `]
})
export class SalesComponent implements OnInit {
  searchQuery = signal<string>('');
  cartItems = signal<CartItem[]>([]);
  discountPercent = signal<number>(0);
  paymentMethod = signal<string>('CASH');

  // Mobile payment
  mobileProvider = signal<string>('');
  mobileNumber = signal<string>('');
  showMobileModal = signal<boolean>(false);

  // Card payment
  cardType = signal<string>('');
  cardNumber = signal<string>('');
  cardHolder = signal<string>('');
  cardExpiry = signal<string>('');
  cardCvv = signal<string>('');
  showCardModal = signal<boolean>(false);

  // Customer selection
  selectedCustomerId = signal<number>(0);
  selectedCustomerName = signal<string>('');

  // Invoice
  showInvoice = signal<boolean>(false);
  invoiceOrder = signal<Order | null>(null);

  enrichedProducts = computed(() => {
    const products = this.productService.products();
    const categories = this.categoryService.categories();
    return products.map(p => ({
      ...p,
      category: categories.find(c => c.id === Number(p.categoryId))?.name || 'Unknown'
    }));
  });

  filteredProducts = computed(() => {
    const products = this.enrichedProducts();
    const query = this.searchQuery().toLowerCase();
    if (!query) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.category && p.category.toLowerCase().includes(query))
    );
  });

  subtotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
  );

  // ✅ Discount amount calculated from percentage
  discountAmount = computed(() =>
    Math.round(this.subtotal() * (this.discountPercent() / 100) * 100) / 100
  );

  taxableBase = computed(() => Math.max(0, this.subtotal() - this.discountAmount()));
  tax = computed(() => Math.round(this.taxableBase() * 0.05 * 100) / 100);
  total = computed(() => this.taxableBase() + this.tax());

  // Formatted card number display
  formattedCardNumber = computed(() => {
    const raw = this.cardNumber().replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(.{4})/g, '$1 ').trim() || '**** **** **** ****';
  });

  constructor(
    public productService: ProductService,
    public orderService: OrderService,
    public customerService: CustomerService,
    public categoryService: CategoryService,
    private dashboardService: DashboardService
  ) { }

  ngOnInit(): void { }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onBarcodeEnter(event: Event): void {
    const code = (event.target as HTMLInputElement).value?.trim();
    if (!code) return;
    const match = this.enrichedProducts().find(
      p => String(p.id) === code || p.name.toLowerCase() === code.toLowerCase()
    );
    if (match) this.addToCart(match);
    (event.target as HTMLInputElement).value = '';
  }

  onCustomerChange(customerId: number): void {
    const id = Number(customerId);
    if (id === 0) {
      this.selectedCustomerId.set(0);
      this.selectedCustomerName.set('');
    } else {
      const customer = this.customerService.customers().find(c => c.id === id);
      if (customer) {
        this.selectedCustomerId.set(customer.id);
        this.selectedCustomerName.set(customer.name);
      }
    }
  }

  // ✅ Percentage discount handler
  onDiscountChange(value: any): void {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) {
      this.discountPercent.set(0);
    } else if (parsed > 100) {
      this.discountPercent.set(100);
    } else {
      this.discountPercent.set(parsed);
    }
  }

  onPaymentMethodChange(method: string): void {
    this.paymentMethod.set(method);
    if (method === 'MOBILE') {
      this.mobileProvider.set('');
      this.mobileNumber.set('');
      this.showMobileModal.set(true);
    }
    if (method === 'CARD') {
      this.cardType.set('');
      this.cardNumber.set('');
      this.cardHolder.set('');
      this.cardExpiry.set('');
      this.cardCvv.set('');
      this.showCardModal.set(true);
    }
  }

  selectMobileProvider(provider: string): void {
    this.mobileProvider.set(provider);
  }

  confirmMobilePayment(): void {
    if (!this.mobileProvider()) {
      alert('Please select a mobile payment provider.');
      return;
    }
    if (!this.mobileNumber() || this.mobileNumber().length < 11) {
      alert('Please enter a valid 11-digit mobile number.');
      return;
    }
    this.showMobileModal.set(false);
  }

  cancelMobilePayment(): void {
    this.showMobileModal.set(false);
    this.paymentMethod.set('CASH');
    this.mobileProvider.set('');
    this.mobileNumber.set('');
  }

  selectCardType(type: string): void {
    this.cardType.set(type);
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber.set(raw);
    input.value = raw.replace(/(.{4})/g, '$1 ').trim();
  }

  onExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '').slice(0, 4);
    let formatted = raw;
    if (raw.length >= 3) {
      formatted = raw.slice(0, 2) + '/' + raw.slice(2);
    } else if (raw.length === 2 && !input.value.includes('/')) {
      formatted = raw + '/';
    }
    this.cardExpiry.set(formatted);
    input.value = formatted;
  }

  onExpiryKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && input.value.endsWith('/')) {
      event.preventDefault();
      const newVal = input.value.slice(0, -1);
      this.cardExpiry.set(newVal);
      input.value = newVal;
    }
  }

  confirmCardPayment(): void {
    if (!this.cardType()) {
      alert('Please select a card type.');
      return;
    }
    if (this.cardNumber().length < 16) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    if (!this.cardHolder().trim()) {
      alert('Please enter the cardholder name.');
      return;
    }
    if (this.cardExpiry().length < 5) {
      alert('Please enter a valid expiry date (MM/YY).');
      return;
    }
    this.showCardModal.set(false);
  }

  cancelCardPayment(): void {
    this.showCardModal.set(false);
    this.paymentMethod.set('CASH');
    this.cardType.set('');
    this.cardNumber.set('');
    this.cardHolder.set('');
    this.cardExpiry.set('');
    this.cardCvv.set('');
  }

  getMaskedCard(): string {
    const num = this.cardNumber();
    if (num.length < 4) return '';
    return '**** **** **** ' + num.slice(-4);
  }

  addToCart(product: Product): void {
    if (product.stock <= 0) return;
    const existingItem = this.cartItems().find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        this.cartItems.update(items => items.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }
    } else {
      this.cartItems.update(items => [...items, { product, quantity: 1 }]);
    }
  }

  removeFromCart(item: CartItem): void {
    this.cartItems.update(items => items.filter(i => i !== item));
  }

  updateQuantity(item: CartItem, delta: number): void {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0 && newQuantity <= item.product.stock) {
      this.cartItems.update(items => items.map(i =>
        i === item ? { ...i, quantity: newQuantity } : i
      ));
    } else if (newQuantity === 0) {
      this.removeFromCart(item);
    }
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.discountPercent.set(0);
    this.selectedCustomerId.set(0);
    this.selectedCustomerName.set('');
    this.mobileProvider.set('');
    this.mobileNumber.set('');
    this.cardType.set('');
    this.cardNumber.set('');
    this.cardHolder.set('');
    this.cardExpiry.set('');
    this.cardCvv.set('');
  }

  checkout(): void {
    if (this.cartItems().length === 0) return;

    if (this.paymentMethod() === 'MOBILE' && (!this.mobileProvider() || !this.mobileNumber())) {
      this.showMobileModal.set(true);
      return;
    }
    if (this.paymentMethod() === 'CARD' && (!this.cardType() || this.cardNumber().length < 16)) {
      this.showCardModal.set(true);
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const sub = this.subtotal();
    const disc = this.discountAmount();
    const taxVal = this.tax();
    const final = this.total();
    const custId = this.selectedCustomerId();
    const custName = custId > 0 ? this.selectedCustomerName() : 'Walk-in';

    let paymentLabel = this.paymentMethod();
    if (this.paymentMethod() === 'MOBILE') {
      paymentLabel = `MOBILE-${this.mobileProvider()}-${this.mobileNumber()}`;
    } else if (this.paymentMethod() === 'CARD') {
      paymentLabel = `CARD-${this.cardType()}-****${this.cardNumber().slice(-4)}`;
    }

    const newOrder: Order = {
      id: 0,
      customerName: custName,
      customerId: custId > 0 ? custId : null,
      date: dateStr,
      status: 'Completed',
      subtotal: sub,
      discount: disc,
      tax: taxVal,
      finalTotal: final,
      total: final,
      paymentMethod: paymentLabel,
      items: this.cartItems().map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      }))
    };

    this.orderService.createOrder(newOrder).subscribe({
      next: (savedOrder) => {
        this.productService.getProducts().subscribe();
        this.dashboardService.loadDashboardData();
        this.invoiceOrder.set({ ...newOrder, ...savedOrder });
        this.showInvoice.set(true);
        this.clearCart();
      },
      error: () => {
        this.invoiceOrder.set(newOrder);
        this.showInvoice.set(true);
        this.clearCart();
      }
    });
  }

  closeInvoice(): void {
    this.showInvoice.set(false);
    this.invoiceOrder.set(null);
  }

  printInvoice(): void {
    window.print();
  }

  getSelectedCustomer(): Customer | null {
    const id = this.selectedCustomerId();
    if (id === 0) return null;
    return this.customerService.customers().find(c => c.id === id) || null;
  }
}