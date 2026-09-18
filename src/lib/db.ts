// Adapter Supabase + ImageKit - substitui localStorage + IndexedDB
// Usa supabase client em src/integrations/supabase/client.ts:12 e ImageKit em src/lib/imagekit.ts:18
import { supabase } from "@/integrations/supabase/client";
import { uploadToImageKit } from "./imagekit";

// Re-exporta tipos compatíveis com o antigo localStorage.ts
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

// Helpers
function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    max_installments: row.max_installments ?? 10,
    image_url: row.image_url,
    category_id: row.category_id,
    sizes: row.sizes ?? null,
    created_at: row.created_at,
  };
}
function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image_url: row.image_url,
    link_url: row.link_url,
    position: row.position ?? 0,
    type: (row.type as any) ?? 'product',
    created_at: row.created_at,
  };
}

// ==================== PRODUCTS ====================
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProduct);
}
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return null;
  return data ? mapProduct(data) : null;
}
export async function addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert({
    name: product.name,
    description: product.description,
    price: product.price,
    max_installments: product.max_installments,
    image_url: product.image_url,
    category_id: product.category_id,
    sizes: product.sizes,
  }).select().single();
  if (error) throw error;
  return mapProduct(data);
}
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const { data, error } = await supabase.from('products').update({
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.price !== undefined && { price: updates.price }),
    ...(updates.max_installments !== undefined && { max_installments: updates.max_installments }),
    ...(updates.image_url !== undefined && { image_url: updates.image_url }),
    ...(updates.category_id !== undefined && { category_id: updates.category_id }),
    ...(updates.sizes !== undefined && { sizes: updates.sizes }),
  }).eq('id', id).select().single();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}
export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ==================== PRODUCT IMAGES ====================
export async function getProductImagesByProductId(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase.from('product_images').select('*').eq('product_id', productId).order('display_order', { ascending: true });
  if (error) throw error;
  return (data || []) as ProductImage[];
}
export async function addProductImage(image: Omit<ProductImage, 'id' | 'created_at'>): Promise<ProductImage> {
  const { data, error } = await supabase.from('product_images').insert(image).select().single();
  if (error) throw error;
  return data as ProductImage;
}
export async function deleteProductImage(id: string): Promise<boolean> {
  const { error } = await supabase.from('product_images').delete().eq('id', id);
  if (error) throw error;
  return true;
}
export async function updateProductImageOrder(imageIds: string[]): Promise<void> {
  for (let i = 0; i < imageIds.length; i++) {
    await supabase.from('product_images').update({ display_order: i }).eq('id', imageIds[i]);
  }
}

// ==================== CATEGORIES ====================
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('position', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCategory);
}
export async function getCategoriesByType(type: 'product' | 'rail'): Promise<Category[]> {
  const cats = await getCategories();
  return cats.filter(c => c.type === type);
}
export async function addCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert({
    name: category.name,
    slug: category.slug,
    image_url: category.image_url,
    link_url: category.link_url,
    position: category.position,
    type: category.type,
  }).select().single();
  if (error) throw error;
  return mapCategory(data);
}
export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data ? mapCategory(data) : null;
}
export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  return true;
}
export async function updateCategoryPositions(orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('categories').update({ position: i }).eq('id', orderedIds[i]);
  }
}

// ==================== COUPONS ====================
export async function getCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Coupon[];
}
export async function addCoupon(coupon: Omit<Coupon, 'id' | 'created_at'>): Promise<Coupon> {
  const { data, error } = await supabase.from('coupons').insert(coupon).select().single();
  if (error) throw error;
  return data as Coupon;
}
export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
  const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Coupon;
}
export async function deleteCoupon(id: string): Promise<boolean> {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw error;
  return true;
}
export async function getValidCoupon(code: string): Promise<Coupon | null> {
  const { data } = await supabase.from('coupons').select('*').ilike('code', code).single();
  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  return data as Coupon;
}

// ==================== SITE SETTINGS ====================
export async function getSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from('site_settings').select('*').limit(1).single();
  if (!data) return defaultSettings;
  return {
    banner_text: data.banner_text ?? defaultSettings.banner_text,
    banner_color: data.banner_color ?? defaultSettings.banner_color,
    whatsapp_number: data.whatsapp_number ?? defaultSettings.whatsapp_number,
    primary_color: data.primary_color ?? defaultSettings.primary_color,
    secondary_color: data.secondary_color ?? defaultSettings.secondary_color,
    button_color: data.button_color ?? defaultSettings.button_color,
    button_text: data.button_text ?? defaultSettings.button_text,
    accent_color: data.accent_color ?? defaultSettings.accent_color,
    button_size: (data.button_size as any) ?? defaultSettings.button_size,
    button_border_radius: data.button_border_radius ?? defaultSettings.button_border_radius,
  };
}
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const { data: existing } = await supabase.from('site_settings').select('id').limit(1).single();
  if (!existing) {
    const { data, error } = await supabase.from('site_settings').insert(settings).select().single();
    if (error) throw error;
    return getSiteSettings();
  }
  const { error } = await supabase.from('site_settings').update(settings).eq('id', existing.id);
  if (error) throw error;
  return getSiteSettings();
}

// ==================== CAROUSEL ====================
export async function getCarouselImages(): Promise<CarouselImage[]> {
  const { data, error } = await supabase.from('carousel_images').select('*').order('position', { ascending: true });
  if (error) throw error;
  return (data || []) as CarouselImage[];
}
export async function addCarouselImage(image: Omit<CarouselImage, 'id' | 'created_at'>): Promise<CarouselImage> {
  const { data, error } = await supabase.from('carousel_images').insert(image).select().single();
  if (error) throw error;
  return data as CarouselImage;
}
export async function updateCarouselImage(id: string, updates: Partial<CarouselImage>): Promise<CarouselImage | null> {
  const { data, error } = await supabase.from('carousel_images').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as CarouselImage;
}
export async function deleteCarouselImage(id: string): Promise<boolean> {
  const { error } = await supabase.from('carousel_images').delete().eq('id', id);
  if (error) throw error;
  return true;
}
export async function updateCarouselImagePositions(orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('carousel_images').update({ position: i }).eq('id', orderedIds[i]);
  }
}

// ==================== INSTITUTIONAL BLOCKS ====================
export async function getInstitutionalBlocks(): Promise<InstitutionalBlock[]> {
  const { data, error } = await supabase.from('institutional_blocks').select('*').order('position', { ascending: true });
  if (error) throw error;
  return (data || []) as InstitutionalBlock[];
}
export async function addInstitutionalBlock(block: Omit<InstitutionalBlock, 'id' | 'created_at'>): Promise<InstitutionalBlock> {
  const { data, error } = await supabase.from('institutional_blocks').insert(block).select().single();
  if (error) throw error;
  return data as InstitutionalBlock;
}
export async function updateInstitutionalBlock(id: string, updates: Partial<InstitutionalBlock>): Promise<InstitutionalBlock | null> {
  const { data, error } = await supabase.from('institutional_blocks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as InstitutionalBlock;
}
export async function deleteInstitutionalBlock(id: string): Promise<boolean> {
  const { error } = await supabase.from('institutional_blocks').delete().eq('id', id);
  if (error) throw error;
  return true;
}
export async function updateInstitutionalBlockPositions(orderedIds: string[]): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('institutional_blocks').update({ position: i }).eq('id', orderedIds[i]);
  }
}

// ==================== STORAGE - ImageKit ====================
export async function uploadImage(file: File): Promise<string> {
  // usa ImageKit em vez de IndexedDB
  return uploadToImageKit(file);
}

// ==================== AUTH (Supabase) ====================
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  return !!data;
}
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}
export async function logoutUser() {
  await supabase.auth.signOut();
}
