"use client";

export interface CartItem {
  productId: number
  name: string
  basePrice: number
  finalPrice: number
  quantity: number
  category: string
  selectedOptions: {
    id: number
    name: string
    price: number
  }[]
  notes?: string
}

export interface PackageItem {
  id: string; 
  name: string;
  items: CartItem[]; 
  quantity: number; 
  totalPrice: number; 
  category: 'package'; 
}
// مفتاح التخزين في localStorage
const STORAGE_KEY = 'baklawa_cart';

// Simple event-driven cart state
let cartItems: CartItem[] = [];
const listeners: Set<() => void> = new Set();

// Immutable snapshots
let cartSnapshot: CartItem[] = [];
let totalSnapshot = 0;
let countSnapshot = 0;

// Stable server-side snapshots
const SERVER_CART: CartItem[] = [];
const SERVER_TOTAL = 0;
const SERVER_COUNT = 0;

// تحميل السلة من localStorage عند بدء التشغيل
function loadCartFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        cartItems = JSON.parse(saved);
        updateSnapshots(); // تحديث الـ snapshots بعد التحميل
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }
}

// حفظ السلة في localStorage
function saveCartToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }
}

// تحميل السلة عند بدء التشغيل
loadCartFromStorage();

function updateSnapshots() {
  cartSnapshot = [...cartItems];
  totalSnapshot = cartItems.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
  countSnapshot = cartItems.reduce((s, i) => s + i.quantity, 0);
}

function notify() {
  updateSnapshots();
  saveCartToStorage(); // حفظ بعد كل تغيير
  listeners.forEach((fn) => fn());
}

export function getCart(): CartItem[] {
  return cartSnapshot;
}

export function getCartTotal(): number {
  return totalSnapshot;
}

export function getCartCount(): number {
  return countSnapshot;
}

// Server snapshot getters
export function getServerCart(): CartItem[] {
  return SERVER_CART;
}

export function getServerTotal(): number {
  return SERVER_TOTAL;
}

export function getServerCount(): number {
  return SERVER_COUNT;
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const existing = cartItems.find(
    (ci) =>
      ci.productId === item.productId &&
      JSON.stringify(ci.selectedOptions) === JSON.stringify(item.selectedOptions)
  );
  
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({ ...item, quantity: 1 });
  }
  notify();
}

export function removeFromCart(productId: number, selectedOptions: CartItem['selectedOptions']) {
  cartItems = cartItems.filter(
    (ci) =>
      !(ci.productId === productId && 
        JSON.stringify(ci.selectedOptions) === JSON.stringify(selectedOptions))
  );
  notify();
}

export function updateQuantity(
  productId: number,
  selectedOptions: CartItem['selectedOptions'],
  quantity: number
) {
  const item = cartItems.find(
    (ci) =>
      ci.productId === productId && 
      JSON.stringify(ci.selectedOptions) === JSON.stringify(selectedOptions)
  );
  
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId, selectedOptions);
    } else {
      item.quantity = quantity;
      notify();
    }
  }
}

export function clearCart() {
  cartItems = [];
  notify();
}

export function subscribeToCart(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}