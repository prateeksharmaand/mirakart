export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number;
  currentPrice: number;
  priceChanged: boolean;
  isAvailable: boolean;
  availableStock: number;
  product: { id: string; name: string; slug: string; image?: string };
  variant: {
    sku: string;
    attributeValues: { attributeName: string; value: string; colorHex: string | null }[];
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}
