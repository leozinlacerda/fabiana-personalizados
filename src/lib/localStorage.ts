// Sistema de armazenamento local para substituir Supabase

import { saveImageToIDB, generateImageId } from './imageStorage';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  max_installments: number;
  image_url: string | null;
  category_id: string | null;
  sizes: string[] | null;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  link_url: string | null;
  position: number;
  type: 'product' | 'rail';
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  expires_at: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
}

export interface SiteSettings {
  banner_text: string;
  banner_color: string;
  whatsapp_number: string;
  primary_color: string;
  secondary_color: string;
  button_color: string;
  button_text: string;
  accent_color: string;
  button_size: 'sm' | 'md' | 'lg';
  button_border_radius: string;
}

export interface CarouselImage {
  id: string;
  image_url: string;
  title: string;
  link_url: string;
  position: number;
  created_at: string;
}

export interface InstitutionalBlock {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: number;
  created_at: string;
}

// Chaves do localStorage
const KEYS = {
  PRODUCTS: 'fabiana_products',
  PRODUCT_IMAGES: 'fabiana_product_images',
  CATEGORIES: 'fabiana_categories',
  COUPONS: 'fabiana_coupons',
  USERS: 'fabiana_users',
  CURRENT_USER: 'fabiana_current_user',
  SITE_SETTINGS: 'fabiana_site_settings',
  CAROUSEL_IMAGES: 'fabiana_carousel_images',
  INSTITUTIONAL_BLOCKS: 'fabiana_institutional_blocks',
};

// Funções auxiliares
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function getFromStorageSingle<T>(key: string): T | null {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function saveToStorageSingle<T>(key: string, data: T | null): void {
  if (data === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// Inicializar dados padrão se não existirem
export function initializeDefaultData(): void {
  if (getFromStorage(KEYS.CATEGORIES).length === 0) {
    const defaultCategories: Category[] = [
      { id: generateId(), name: 'Véus', slug: 'veus', image_url: null, link_url: null, position: 0, type: 'product', created_at: new Date().toISOString() },
      { id: generateId(), name: 'Binários', slug: 'binarios', image_url: null, link_url: null, position: 1, type: 'product', created_at: new Date().toISOString() },
      { id: generateId(), name: 'Hinários', slug: 'hinarios', image_url: null, link_url: null, position: 2, type: 'product', created_at: new Date().toISOString() },
      { id: generateId(), name: 'Infantis', slug: 'infantis', image_url: null, link_url: null, position: 3, type: 'product', created_at: new Date().toISOString() },
      { id: generateId(), name: 'Acessórios', slug: 'acessorios', image_url: null, link_url: null, position: 4, type: 'product', created_at: new Date().toISOString() },
    ];
    saveToStorage(KEYS.CATEGORIES, defaultCategories);
  }

  if (getFromStorage(KEYS.USERS).length === 0) {
    const defaultUsers: User[] = [
      { id: 'admin-id', email: 'admin@fabiana.com', username: 'admin', full_name: 'Administrador' },
    ];
    saveToStorage(KEYS.USERS, defaultUsers);
  }
}

// ==================== PRODUCTS ====================

export function getProducts(): Product[] {
  return getFromStorage<Product>(KEYS.PRODUCTS);
}

export function getProductById(id: string): Product | null {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

export function addProduct(product: Omit<Product, 'id' | 'created_at'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  products.push(newProduct);
  saveToStorage(KEYS.PRODUCTS, products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  products[index] = { ...products[index], ...updates };
  saveToStorage(KEYS.PRODUCTS, products);
  return products[index];
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  
  saveToStorage(KEYS.PRODUCTS, filtered);
  // Também remover imagens do produto
  const images = getProductImages().filter(img => img.product_id !== id);
  saveToStorage(KEYS.PRODUCT_IMAGES, images);
  return true;
}

// ==================== PRODUCT IMAGES ====================

export function getProductImages(): ProductImage[] {
  return getFromStorage<ProductImage>(KEYS.PRODUCT_IMAGES);
}

export function getProductImagesByProductId(productId: string): ProductImage[] {
  const images = getProductImages();
  return images
    .filter(img => img.product_id === productId)
    .sort((a, b) => a.display_order - b.display_order);
}

export function addProductImage(image: Omit<ProductImage, 'id' | 'created_at'>): ProductImage {
  const images = getProductImages();
  const newImage: ProductImage = {
    ...image,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  images.push(newImage);
  saveToStorage(KEYS.PRODUCT_IMAGES, images);
  return newImage;
}

export function deleteProductImage(id: string): boolean {
  const images = getProductImages();
  const filtered = images.filter(img => img.id !== id);
  if (filtered.length === images.length) return false;
  
  saveToStorage(KEYS.PRODUCT_IMAGES, filtered);
  return true;
}

export function updateProductImageOrder(imageIds: string[]): void {
  const images = getProductImages();
  const updated = images.map(img => ({
    ...img,
    display_order: imageIds.indexOf(img.id)
  }));
  saveToStorage(KEYS.PRODUCT_IMAGES, updated);
}

// ==================== CATEGORIES ====================

export function getCategories(): Category[] {
  const categories = getFromStorage<Category>(KEYS.CATEGORIES);
  return categories.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function getCategoriesByType(type: 'product' | 'rail'): Category[] {
  return getCategories().filter(c => c.type === type);
}

export function getCategoryById(id: string): Category | null {
  const categories = getCategories();
  return categories.find(c => c.id === id) || null;
}

export function addCategory(category: Omit<Category, 'id' | 'created_at'>): Category {
  const categories = getCategories();
  const newCategory: Category = {
    ...category,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  categories.push(newCategory);
  saveToStorage(KEYS.CATEGORIES, categories);
  return newCategory;
}

export function updateCategory(id: string, updates: Partial<Category>): Category | null {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  categories[index] = { ...categories[index], ...updates };
  saveToStorage(KEYS.CATEGORIES, categories);
  return categories[index];
}

export function deleteCategory(id: string): boolean {
  const categories = getCategories();
  const filtered = categories.filter(c => c.id !== id);
  if (filtered.length === categories.length) return false;
  
  saveToStorage(KEYS.CATEGORIES, filtered);
  return true;
}

export function updateCategoryPositions(orderedIds: string[]): void {
  const categories = getFromStorage<Category>(KEYS.CATEGORIES);
  const updated = categories.map(cat => ({
    ...cat,
    position: orderedIds.indexOf(cat.id)
  }));
  saveToStorage(KEYS.CATEGORIES, updated);
}

// ==================== COUPONS ====================

export function getCoupons(): Coupon[] {
  return getFromStorage<Coupon>(KEYS.COUPONS);
}

export function getCouponByCode(code: string): Coupon | null {
  const coupons = getCoupons();
  const upperCode = code.toUpperCase();
  return coupons.find(c => c.code.toUpperCase() === upperCode) || null;
}

export function getValidCoupon(code: string): Coupon | null {
  const coupon = getCouponByCode(code);
  if (!coupon) return null;
  
  const expiresAt = new Date(coupon.expires_at);
  if (expiresAt < new Date()) return null;
  
  return coupon;
}

export function addCoupon(coupon: Omit<Coupon, 'id' | 'created_at'>): Coupon {
  const coupons = getCoupons();
  const newCoupon: Coupon = {
    ...coupon,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  coupons.push(newCoupon);
  saveToStorage(KEYS.COUPONS, coupons);
  return newCoupon;
}

export function updateCoupon(id: string, updates: Partial<Coupon>): Coupon | null {
  const coupons = getCoupons();
  const index = coupons.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  coupons[index] = { ...coupons[index], ...updates };
  saveToStorage(KEYS.COUPONS, coupons);
  return coupons[index];
}

export function deleteCoupon(id: string): boolean {
  const coupons = getCoupons();
  const filtered = coupons.filter(c => c.id !== id);
  if (filtered.length === coupons.length) return false;
  
  saveToStorage(KEYS.COUPONS, filtered);
  return true;
}

// ==================== USERS / AUTH ====================

export function getUsers(): User[] {
  return getFromStorage<User>(KEYS.USERS);
}

export function getUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
}

export function getCurrentUser(): User | null {
  return getFromStorageSingle<User>(KEYS.CURRENT_USER);
}

export function setCurrentUser(user: User | null): void {
  saveToStorageSingle<User>(KEYS.CURRENT_USER, user);
}

export function loginUser(email: string, password: string): User | null {
  // Simulação simples - senha sempre "admin" para teste
  if (password !== 'admin') return null;
  
  const user = getUserByEmail(email);
  if (!user) return null;
  
  setCurrentUser(user);
  return user;
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.email === 'admin@fabiana.com';
}

// ==================== STORAGE (IndexedDB para imagens) ====================

export function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const id = generateImageId();
        await saveImageToIDB(id, reader.result as string);
        resolve(id);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== SITE SETTINGS ====================

const defaultSettings: SiteSettings = {
  banner_text: 'FRETE GRÁTIS A PARTIR DE R$199,00 - PARCELAMENTO EM ATÉ 10X SEM JUROS',
  banner_color: '#7b7b7b',
  whatsapp_number: '5511999999999',
  primary_color: '#9f9f9f',
  secondary_color: '#f5f5f5',
  button_color: '#C4A77D',
  button_text: 'Comprar',
  accent_color: '#C4A77D',
  button_size: 'md',
  button_border_radius: '4',
};

export function getSiteSettings(): SiteSettings {
  const saved = getFromStorageSingle<SiteSettings>(KEYS.SITE_SETTINGS);
  return { ...defaultSettings, ...saved };
}

export function updateSiteSettings(settings: Partial<SiteSettings>): SiteSettings {
  const current = getSiteSettings();
  const updated = { ...current, ...settings };
  saveToStorageSingle(KEYS.SITE_SETTINGS, updated);
  return updated;
}

// ==================== CAROUSEL IMAGES ====================

export function getCarouselImages(): CarouselImage[] {
  return getFromStorage<CarouselImage>(KEYS.CAROUSEL_IMAGES).sort((a, b) => a.position - b.position);
}

export function addCarouselImage(image: Omit<CarouselImage, 'id' | 'created_at'>): CarouselImage {
  const images = getCarouselImages();
  const newImage: CarouselImage = {
    ...image,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  images.push(newImage);
  saveToStorage(KEYS.CAROUSEL_IMAGES, images);
  return newImage;
}

export function updateCarouselImage(id: string, updates: Partial<CarouselImage>): CarouselImage | null {
  const images = getCarouselImages();
  const index = images.findIndex(img => img.id === id);
  if (index === -1) return null;

  images[index] = { ...images[index], ...updates };
  saveToStorage(KEYS.CAROUSEL_IMAGES, images);
  return images[index];
}

export function deleteCarouselImage(id: string): boolean {
  const images = getCarouselImages();
  const filtered = images.filter(img => img.id !== id);
  if (filtered.length === images.length) return false;

  saveToStorage(KEYS.CAROUSEL_IMAGES, filtered);
  return true;
}

export function updateCarouselImagePositions(orderedIds: string[]): void {
  const images = getFromStorage<CarouselImage>(KEYS.CAROUSEL_IMAGES);
  const updated = images.map(img => ({
    ...img,
    position: orderedIds.indexOf(img.id) !== -1 ? orderedIds.indexOf(img.id) : img.position,
  }));
  saveToStorage(KEYS.CAROUSEL_IMAGES, updated);
}

// ==================== INSTITUTIONAL BLOCKS ====================

export function getInstitutionalBlocks(): InstitutionalBlock[] {
  return getFromStorage<InstitutionalBlock>(KEYS.INSTITUTIONAL_BLOCKS).sort((a, b) => a.position - b.position);
}

export function addInstitutionalBlock(block: Omit<InstitutionalBlock, 'id' | 'created_at'>): InstitutionalBlock {
  const blocks = getInstitutionalBlocks();
  const newBlock: InstitutionalBlock = {
    ...block,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  blocks.push(newBlock);
  saveToStorage(KEYS.INSTITUTIONAL_BLOCKS, blocks);
  return newBlock;
}

export function updateInstitutionalBlock(id: string, updates: Partial<InstitutionalBlock>): InstitutionalBlock | null {
  const blocks = getInstitutionalBlocks();
  const index = blocks.findIndex(b => b.id === id);
  if (index === -1) return null;

  blocks[index] = { ...blocks[index], ...updates };
  saveToStorage(KEYS.INSTITUTIONAL_BLOCKS, blocks);
  return blocks[index];
}

export function deleteInstitutionalBlock(id: string): boolean {
  const blocks = getInstitutionalBlocks();
  const filtered = blocks.filter(b => b.id !== id);
  if (filtered.length === blocks.length) return false;

  saveToStorage(KEYS.INSTITUTIONAL_BLOCKS, filtered);
  return true;
}

export function updateInstitutionalBlockPositions(orderedIds: string[]): void {
  const blocks = getFromStorage<InstitutionalBlock>(KEYS.INSTITUTIONAL_BLOCKS);
  const updated = blocks.map(b => ({
    ...b,
    position: orderedIds.indexOf(b.id) !== -1 ? orderedIds.indexOf(b.id) : b.position,
  }));
  saveToStorage(KEYS.INSTITUTIONAL_BLOCKS, updated);
}

// ==================== MIGRAÇÃO: base64 no localStorage → IndexedDB ====================

export async function migrateBase64Images(): Promise<void> {
  function isBase64DataUrl(str: string): boolean {
    return typeof str === 'string' && str.startsWith('data:image');
  }

  function migrateField(value: string | null): string | null {
    if (!value || !isBase64DataUrl(value)) return value;
    const newId = generateImageId();
    saveImageToIDB(newId, value);
    return newId;
  }

  // Migrar produtos
  const products = getFromStorage<Product>(KEYS.PRODUCTS);
  let changed = false;
  products.forEach(p => {
    if (isBase64DataUrl(p.image_url)) {
      p.image_url = migrateField(p.image_url);
      changed = true;
    }
  });
  if (changed) saveToStorage(KEYS.PRODUCTS, products);

  // Migrar imagens de produto
  const productImages = getFromStorage<ProductImage>(KEYS.PRODUCT_IMAGES);
  changed = false;
  productImages.forEach(img => {
    if (isBase64DataUrl(img.image_url)) {
      img.image_url = migrateField(img.image_url);
      changed = true;
    }
  });
  if (changed) saveToStorage(KEYS.PRODUCT_IMAGES, productImages);

  // Migrar imagens do carrossel
  const carouselImages = getFromStorage<CarouselImage>(KEYS.CAROUSEL_IMAGES);
  changed = false;
  carouselImages.forEach(img => {
    if (isBase64DataUrl(img.image_url)) {
      img.image_url = migrateField(img.image_url);
      changed = true;
    }
  });
  if (changed) saveToStorage(KEYS.CAROUSEL_IMAGES, carouselImages);

  // Migrar blocos institucionais
  const blocks = getFromStorage<InstitutionalBlock>(KEYS.INSTITUTIONAL_BLOCKS);
  changed = false;
  blocks.forEach(b => {
    if (isBase64DataUrl(b.image_url)) {
      b.image_url = migrateField(b.image_url);
      changed = true;
    }
  });
  if (changed) saveToStorage(KEYS.INSTITUTIONAL_BLOCKS, blocks);
}

// ==================== INICIALIZAÇÃO ====================

initializeDefaultData();
