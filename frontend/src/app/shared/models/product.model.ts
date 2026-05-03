export interface Product {
  id: number;
  name: string;
  categoryId: number;   // link to category
  brandId: number;      // link to brand
  price: number;
  stock: number;
}