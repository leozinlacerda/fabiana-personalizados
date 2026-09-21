import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Edit, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getProducts,
  getCategories,
  getCategoriesByType,
  getCoupons,
  getSiteSettings,
  updateSiteSettings,
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategoryPositions,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  uploadImage,
  addProductImage,
  getProductImagesByProductId,
  deleteProductImage,
  updateProductImageOrder,
  getCarouselImages,
  addCarouselImage,
  updateCarouselImage,
  deleteCarouselImage,
  updateCarouselImagePositions,
  getInstitutionalBlocks,
  addInstitutionalBlock,
  updateInstitutionalBlock,
  deleteInstitutionalBlock,
  updateInstitutionalBlockPositions,
  Product,
  Category,
  Coupon,
  SiteSettings,
  CarouselImage,
  InstitutionalBlock,
} from "@/lib/db";
import { TestConnections } from "@/components/TestConnections";
import { deleteFromImageKit } from "@/lib/imagekit";

const AdminPanel = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    banner_text: '',
    banner_color: '#7b7b7b',
    whatsapp_number: '',
    primary_color: '#9f9f9f',
    secondary_color: '#f5f5f5',
    button_color: '#C4A77D',
    button_text: 'Comprar',
    accent_color: '#C4A77D',
    button_size: 'md',
    button_border_radius: '4',
    whatsapp_message_template: 'Olá! Gostaria de encomendar:\n\n*{produto}*\nQuantidade: {quantidade}{tamanho}Preço: R$ {preco}',
  });
  
  // Editing states
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    max_installments: "10",
    category_id: "",
    sizes: [] as string[],
    images: [] as File[],
  });
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<string[]>([]); // Track existing ProductImage record IDs
  const [existingImageKeys, setExistingImageKeys] = useState<string[]>([]); // Track IDB keys for existing images
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  
  // Search and filter state
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  
  // Image reorder state
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", link_url: "", image_url: "", type: "product" as 'product' | 'rail' });
  
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_percentage: "",
    expires_at: "",
  });

  // Carousel state
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [editingCarouselImage, setEditingCarouselImage] = useState<string | null>(null);
  const [carouselForm, setCarouselForm] = useState({
    title: "",
    link_url: "",
    image: null as File | null,
  });
  const [carouselImagePreview, setCarouselImagePreview] = useState<string | null>(null);

  // Institutional Blocks state
  const [institutionalBlocks, setInstitutionalBlocks] = useState<InstitutionalBlock[]>([]);
  const [editingInstitutionalBlock, setEditingInstitutionalBlock] = useState<string | null>(null);
  const [institutionalBlockForm, setInstitutionalBlockForm] = useState({
    title: "",
    link_url: "",
    image: null as File | null,
  });
  const [institutionalBlockImagePreview, setInstitutionalBlockImagePreview] = useState<string | null>(null);
  const [productThumbnailUrls, setProductThumbnailUrls] = useState<Record<string, string>>({});
  const [carouselThumbnailUrls, setCarouselThumbnailUrls] = useState<Record<string, string>>({});
  const [blockThumbnailUrls, setBlockThumbnailUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/admin-login");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [loadedProducts, loadedCategories, loadedCoupons, loadedSettings, loadedCarousel, loadedBlocks] = await Promise.all([
        getProducts(),
        getCategories(),
        getCoupons(),
        getSiteSettings(),
        getCarouselImages(),
        getInstitutionalBlocks(),
      ]);
      setProducts(loadedProducts);
      setCategories(loadedCategories);
      setCoupons(loadedCoupons);
      setSiteSettings(loadedSettings);
      setCarouselImages(loadedCarousel);
      setInstitutionalBlocks(loadedBlocks);

      // Imagens agora são URLs diretas do ImageKit, sem IDB
      const thumbnailUrls: Record<string, string> = {};
      for (const p of loadedProducts) {
        if (p.image_url) thumbnailUrls[p.image_url] = p.image_url;
      }
      setProductThumbnailUrls(thumbnailUrls);

      const cUrls: Record<string, string> = {};
      for (const img of loadedCarousel) {
        if (img.image_url) cUrls[img.image_url] = img.image_url;
      }
      setCarouselThumbnailUrls(cUrls);

      const bUrls: Record<string, string> = {};
      for (const b of loadedBlocks) {
        if (b.image_url) bUrls[b.image_url] = b.image_url;
      }
      setBlockThumbnailUrls(bUrls);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast({ title: "Erro ao carregar dados", description: (err as any).message, variant: "destructive" });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadedImageUrls: string[] = [];

      for (const image of productForm.images) {
        const url = await uploadImage(image);
        uploadedImageUrls.push(url);
      }

      if (editingProduct) {
        const updates: Partial<Product> = {
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          max_installments: parseInt(productForm.max_installments) || 10,
          category_id: productForm.category_id || null,
          sizes: productForm.sizes.length > 0 ? productForm.sizes : null,
        };

        if (existingImageKeys.length > 0) {
          updates.image_url = existingImageKeys[0];
        } else if (uploadedImageUrls.length > 0) {
          updates.image_url = uploadedImageUrls[0];
        }

        await updateProduct(editingProduct, updates);

        // Add new images
        if (uploadedImageUrls.length > 0) {
          for (let index = 0; index < uploadedImageUrls.length; index++) {
            const url = uploadedImageUrls[index];
            await addProductImage({
              product_id: editingProduct,
              image_url: url,
              display_order: imageIds.length + index,
            });
          }
        }

        // Save the image order based on the current previews
        if (imageIds.length > 0) {
          await updateProductImageOrder(imageIds);
        }

        toast({ title: "Produto atualizado!" });
        setEditingProduct(null);
        setEditProductDialogOpen(false);
      } else {
        const newProduct = await addProduct({
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          max_installments: parseInt(productForm.max_installments) || 10,
          category_id: productForm.category_id || null,
          sizes: productForm.sizes.length > 0 ? productForm.sizes : null,
          image_url: uploadedImageUrls[0] || null,
        });

        if (uploadedImageUrls.length > 0) {
          for (let index = 0; index < uploadedImageUrls.length; index++) {
            const url = uploadedImageUrls[index];
            await addProductImage({
              product_id: newProduct.id,
              image_url: url,
              display_order: index,
            });
          }
        }

        toast({ title: "Produto adicionado!" });
      }

      setProductForm({ name: "", description: "", price: "", max_installments: "10", category_id: "", images: [] });
      setImagePreviews([]);
      setImageIds([]);
      setExistingImageKeys([]);
      await loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product.id);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      max_installments: (product.max_installments || 10).toString(),
      category_id: product.category_id || "",
      sizes: product.sizes || [],
      images: [],
    });
    const existingImages = await getProductImagesByProductId(product.id);
    const keys = existingImages.map(img => img.image_url);
    setImagePreviews(keys);
    setImageIds(existingImages.map(img => img.id));
    setExistingImageKeys(keys);
    setEditProductDialogOpen(true);
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: "", description: "", price: "", max_installments: "10", category_id: "", sizes: [], images: [] });
    setImagePreviews([]);
    setImageIds([]);
    setExistingImageKeys([]);
    setEditProductDialogOpen(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductForm({ ...productForm, images: [...productForm.images, ...files] });
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = async (index: number) => {
    if (editingProduct) {
      const existingImages = await getProductImagesByProductId(editingProduct);
      if (index < existingImages.length) {
        try { await deleteFromImageKit(existingImages[index].image_url); } catch {}
        await deleteProductImage(existingImages[index].id);
      }
    }
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);

    const newIds = imageIds.filter((_, i) => i !== index);
    setImageIds(newIds);

    const newKeys = existingImageKeys.filter((_, i) => i !== index);
    setExistingImageKeys(newKeys);

    if (editingProduct) {
      if (newKeys.length > 0) {
        await updateProduct(editingProduct, { image_url: newKeys[0] });
      } else {
        await updateProduct(editingProduct, { image_url: null });
      }
    }

    await loadData();
  };

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
      setDraggedImageIndex(null);
      return;
    }

    // Reorder previews
    const newPreviews = [...imagePreviews];
    const draggedPreview = newPreviews[draggedImageIndex];
    newPreviews.splice(draggedImageIndex, 1);
    newPreviews.splice(targetIndex, 0, draggedPreview);
    setImagePreviews(newPreviews);

    // Reorder IDs if they exist
    if (imageIds.length > 0) {
      const newIds = [...imageIds];
      const draggedId = newIds[draggedImageIndex];
      newIds.splice(draggedImageIndex, 1);
      newIds.splice(targetIndex, 0, draggedId);
      setImageIds(newIds);
    }

    if (existingImageKeys.length > 0) {
      const newKeys = [...existingImageKeys];
      const draggedKey = newKeys[draggedImageIndex];
      newKeys.splice(draggedImageIndex, 1);
      newKeys.splice(targetIndex, 0, draggedKey);
      setExistingImageKeys(newKeys);
    }
    
    setDraggedImageIndex(null);
    toast({ title: "Ordem das imagens atualizada!" });
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl: string | null = null;
      if (categoryForm.image_url && categoryForm.image_url.startsWith('data:')) {
        const blob = await fetch(categoryForm.image_url).then(r => r.blob());
        const file = new File([blob], 'category-image.png', { type: blob.type });
        imageUrl = await uploadImage(file);
      } else if (categoryForm.image_url) {
        imageUrl = categoryForm.image_url;
      }

      const categoryData = {
        name: categoryForm.name,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        image_url: imageUrl,
        link_url: categoryForm.link_url || null,
        type: categoryForm.type,
      };

      const currentEditingId = editingCategory;

      if (currentEditingId) {
        await updateCategory(currentEditingId, categoryData);
        toast({ title: "Categoria atualizada!" });
        setEditingCategory(null);
        setEditCategoryDialogOpen(false);
      } else {
        await addCategory(categoryData);
        toast({ title: "Categoria adicionada!" });
      }

      setCategoryForm({ name: "", slug: "", link_url: "", image_url: "", type: categoryForm.type });
      await loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setCategoryForm({ name: category.name, slug: category.slug || "", link_url: category.link_url || "", image_url: category.image_url || "", type: category.type || 'product' });
    setEditCategoryDialogOpen(true);
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", slug: "", link_url: "", image_url: "", type: 'product' });
    setEditCategoryDialogOpen(false);
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon, {
          code: couponForm.code.toUpperCase(),
          discount_percentage: parseInt(couponForm.discount_percentage),
          expires_at: new Date(couponForm.expires_at).toISOString(),
        });
        toast({ title: "Cupom atualizado!" });
        setEditingCoupon(null);
      } else {
        await addCoupon({
          code: couponForm.code.toUpperCase(),
          discount_percentage: parseInt(couponForm.discount_percentage),
          expires_at: new Date(couponForm.expires_at).toISOString(),
        });
        toast({ title: "Cupom criado!" });
      }

      setCouponForm({ code: "", discount_percentage: "", expires_at: "" });
      await loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon.id);
    const expiresDate = new Date(coupon.expires_at);
    const formattedDate = expiresDate.toISOString().slice(0, 16);
    setCouponForm({
      code: coupon.code,
      discount_percentage: coupon.discount_percentage.toString(),
      expires_at: formattedDate,
    });
  };

  const handleCancelEditCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({ code: "", discount_percentage: "", expires_at: "" });
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const imgs = await getProductImagesByProductId(id);
      for (const img of imgs) { try { await deleteFromImageKit(img.image_url); } catch {} }
    } catch {}
    await deleteProduct(id);
    toast({ title: "Produto excluído!" });
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat?.image_url && cat.image_url.startsWith('http')) { try { await deleteFromImageKit(cat.image_url); } catch {} }
    await deleteCategory(id);
    toast({ title: "Categoria excluída!" });
    await loadData();
  };

  const handleMoveCategoryUp = async (categoryId: string) => {
    const categoryIds = categories.map(c => c.id);
    const index = categoryIds.indexOf(categoryId);
    if (index <= 0) return;
    
    // Swap with previous
    [categoryIds[index - 1], categoryIds[index]] = [categoryIds[index], categoryIds[index - 1]];
    
    await updateCategoryPositions(categoryIds);
    await loadData();
    toast({ title: "Ordem atualizada!" });
  };

  const handleMoveCategoryDown = async (categoryId: string) => {
    const categoryIds = categories.map(c => c.id);
    const index = categoryIds.indexOf(categoryId);
    if (index === -1 || index >= categoryIds.length - 1) return;
    
    // Swap with next
    [categoryIds[index], categoryIds[index + 1]] = [categoryIds[index + 1], categoryIds[index]];
    
    await updateCategoryPositions(categoryIds);
    await loadData();
    toast({ title: "Ordem atualizada!" });
  };

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedCategory || draggedCategory === targetCategoryId) {
      setDraggedCategory(null);
      return;
    }

    const categoryIds = categories.map(c => c.id);
    const draggedIndex = categoryIds.indexOf(draggedCategory);
    const targetIndex = categoryIds.indexOf(targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedCategory(null);
      return;
    }

    categoryIds.splice(draggedIndex, 1);
    categoryIds.splice(targetIndex, 0, draggedCategory);

    await updateCategoryPositions(categoryIds);
    await loadData();
    setDraggedCategory(null);
    toast({ title: "Ordem atualizada!" });
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleDeleteCoupon = async (id: string) => {
    await deleteCoupon(id);
    toast({ title: "Cupom excluído!" });
    await loadData();
  };

  // ==================== CAROUSEL HANDLERS ====================

  const handleAddCarouselImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = carouselImagePreview || "";

      if (carouselForm.image) {
        imageUrl = await uploadImage(carouselForm.image);
      }

      if (!imageUrl) {
        toast({ title: "Selecione uma imagem", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (editingCarouselImage) {
        await updateCarouselImage(editingCarouselImage, {
          image_url: imageUrl,
          title: carouselForm.title,
          link_url: carouselForm.link_url,
        });
        toast({ title: "Imagem atualizada!" });
        setEditingCarouselImage(null);
      } else {
        await addCarouselImage({
          image_url: imageUrl,
          title: carouselForm.title,
          link_url: carouselForm.link_url,
          position: carouselImages.length,
        });
        toast({ title: "Imagem adicionada!" });
      }

      setCarouselForm({ title: "", link_url: "", image: null });
      setCarouselImagePreview(null);
      await loadData();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCarouselImage = async (image: CarouselImage) => {
    setEditingCarouselImage(image.id);
    setCarouselForm({
      title: image.title || "",
      link_url: image.link_url || "",
      image: null,
    });
    setCarouselImagePreview(image.image_url);
  };

  const handleCancelEditCarouselImage = () => {
    setEditingCarouselImage(null);
    setCarouselForm({ title: "", link_url: "", image: null });
    setCarouselImagePreview(null);
  };

  const handleDeleteCarouselImage = async (id: string) => {
    const img = carouselImages.find(c => c.id === id);
    if (img?.image_url) { try { await deleteFromImageKit(img.image_url); } catch {} }
    await deleteCarouselImage(id);
    toast({ title: "Imagem excluída!" });
    await loadData();
  };

  const handleCarouselImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCarouselForm({ ...carouselForm, image: file });
      setCarouselImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMoveCarouselImageUp = async (imageId: string) => {
    const imageIds = carouselImages.map(img => img.id);
    const index = imageIds.indexOf(imageId);
    if (index <= 0) return;

    [imageIds[index - 1], imageIds[index]] = [imageIds[index], imageIds[index - 1]];
    await updateCarouselImagePositions(imageIds);
    await loadData();
    toast({ title: "Ordem atualizada!" });
  };

  const handleMoveCarouselImageDown = async (imageId: string) => {
    const imageIds = carouselImages.map(img => img.id);
    const index = imageIds.indexOf(imageId);
    if (index === -1 || index >= imageIds.length - 1) return;

    [imageIds[index], imageIds[index + 1]] = [imageIds[index + 1], imageIds[index]];
    await updateCarouselImagePositions(imageIds);
    await loadData();
    toast({ title: "Ordem atualizada!" });
  };

  // Institutional Block handlers
  const handleAddInstitutionalBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingInstitutionalBlock && institutionalBlocks.length >= 2) {
      toast({ title: "Máximo de 2 blocos permitidos", variant: "destructive" });
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      let imageUrl = "";

      if (institutionalBlockForm.image) {
        imageUrl = await uploadImage(institutionalBlockForm.image);
      } else if (editingInstitutionalBlock) {
        const existing = institutionalBlocks.find(b => b.id === editingInstitutionalBlock);
        imageUrl = existing?.image_url || "";
      }

      if (editingInstitutionalBlock) {
        await updateInstitutionalBlock(editingInstitutionalBlock, {
          title: institutionalBlockForm.title,
          link_url: institutionalBlockForm.link_url,
          image_url: imageUrl,
        });
        toast({ title: "Bloco atualizado!" });
        setEditingInstitutionalBlock(null);
      } else {
        await addInstitutionalBlock({
          title: institutionalBlockForm.title,
          link_url: institutionalBlockForm.link_url,
          image_url: imageUrl,
          position: institutionalBlocks.length,
        });
        toast({ title: "Bloco adicionado!" });
      }

      setInstitutionalBlockForm({ title: "", link_url: "", image: null });
      setInstitutionalBlockImagePreview(null);
      await loadData();
    } catch (error) {
      toast({ title: "Erro ao salvar bloco", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditInstitutionalBlock = async (block: InstitutionalBlock) => {
    setEditingInstitutionalBlock(block.id);
    setInstitutionalBlockForm({
      title: block.title,
      link_url: block.link_url,
      image: null,
    });
    setInstitutionalBlockImagePreview(block.image_url);
  };

  const handleCancelEditInstitutionalBlock = () => {
    setEditingInstitutionalBlock(null);
    setInstitutionalBlockForm({ title: "", link_url: "", image: null });
    setInstitutionalBlockImagePreview(null);
  };

  const handleDeleteInstitutionalBlock = async (id: string) => {
    await deleteInstitutionalBlock(id);
    toast({ title: "Bloco excluído!" });
    loadData();
  };

  const handleInstitutionalBlockImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInstitutionalBlockForm({ ...institutionalBlockForm, image: file });
      setInstitutionalBlockImagePreview(URL.createObjectURL(file));
    }
  };

  const handleMoveInstitutionalBlockUp = async (blockId: string) => {
    const blockIds = institutionalBlocks.map(b => b.id);
    const index = blockIds.indexOf(blockId);
    if (index <= 0) return;

    [blockIds[index - 1], blockIds[index]] = [blockIds[index], blockIds[index - 1]];
    await updateInstitutionalBlockPositions(blockIds);
    await loadData();
    toast({ title: "Ordem atualizada!" });
  };

  const handleMoveInstitutionalBlockDown = async (blockId: string) => {
    const blockIds = institutionalBlocks.map(b => b.id);
    const index = blockIds.indexOf(blockId);
    if (index === -1 || index >= blockIds.length - 1) return;

    [blockIds[index], blockIds[index + 1]] = [blockIds[index + 1], blockIds[index]];
    await updateInstitutionalBlockPositions(blockIds);
    await loadData();
    toast({ title: "Ordem atualizada!" });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || '-';
  };

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === "all" || product.category_id === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-serif font-bold">Painel Administrativo</h1>
          <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto">
            Voltar ao Site
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="w-full flex flex-wrap">
            <TabsTrigger value="products" className="flex-1 text-xs sm:text-sm min-w-0">Produtos</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 text-xs sm:text-sm min-w-0">Categorias</TabsTrigger>
            <TabsTrigger value="carousel" className="flex-1 text-xs sm:text-sm min-w-0">Carrossel</TabsTrigger>
            <TabsTrigger value="institutional" className="flex-1 text-xs sm:text-sm min-w-0">Blocos</TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex-1 text-xs sm:text-sm min-w-0">WhatsApp</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-xs sm:text-sm min-w-0">Personalizar</TabsTrigger>
            <TabsTrigger value="teste" className="flex-1 text-xs sm:text-sm min-w-0 bg-yellow-100 data-[state=active]:bg-yellow-200">Teste Conexão</TabsTrigger>
          </TabsList>

          {/* PRODUTOS */}
          <TabsContent value="products" className="space-y-4">
            {/* Formulário de Adicionar */}
            <form onSubmit={handleAddProduct} className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 bg-card rounded-lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold mb-3 sm:mb-4">
                Adicionar Produto
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="productName" className="text-sm">Nome</Label>
                  <Input
                    id="productName"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="productPrice" className="text-sm">Preço (R$)</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="productInstallments" className="text-sm">Máx. Parcelas</Label>
                  <Input
                    id="productInstallments"
                    type="number"
                    min="1"
                    max="48"
                    value={productForm.max_installments}
                    onChange={(e) => setProductForm({ ...productForm, max_installments: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {productForm.price && parseFloat(productForm.price) > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Pré-visualização:</p>
                  <p className="text-sm text-muted-foreground">
                    {productForm.max_installments || 10}x de R${(parseFloat(productForm.price) / parseInt(productForm.max_installments || '10')).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-lg font-semibold" style={{ color: siteSettings?.primary_color || '#9f9f9f' }}>
                    R${parseFloat(productForm.price).toFixed(2).replace('.', ',')} no pix
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="productCategory" className="text-sm">Categoria</Label>
                  <Select
                    value={productForm.category_id}
                    onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.type !== 'rail').map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="productSizes" className="text-sm">Tamanhos (opcional)</Label>
                  <Input
                    id="productSizes"
                    value={productForm.sizes.join(', ')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const sizes = raw.split(',').map(s => s.trim());
                      setProductForm({ ...productForm, sizes });
                    }}
                    onBlur={() => {
                      const cleaned = productForm.sizes.filter(s => s.length > 0);
                      setProductForm({ ...productForm, sizes: cleaned });
                    }}
                    placeholder="Ex: P, M, G, GG"
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Separe por vírgula. Deixe vazio se não houver tamanhos.</p>
                </div>
              </div>

              <div>
                <Label htmlFor="productImage" className="text-sm">Imagens do Produto</Label>
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="cursor-pointer mt-1"
                />
              </div>

              {imagePreviews.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Arraste para definir a imagem principal</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {imagePreviews.map((preview, index) => (
                      <div 
                        key={index} 
                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border cursor-move ${draggedImageIndex === index ? 'opacity-50 border-primary' : 'border-border'}`}
                        draggable
                        onDragStart={(e) => handleImageDragStart(e, index)}
                        onDragOver={handleImageDragOver}
                        onDrop={(e) => handleImageDrop(e, index)}
                        onDragEnd={handleImageDragEnd}
                      >
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        {index === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center py-0.5">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Adicionar Produto
              </Button>
            </form>

            {/* Grid de Produtos */}
            <div className="bg-card rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg sm:text-xl font-serif font-semibold">Produtos ({filteredProducts.length})</h3>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Buscar produto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full sm:w-48"
                  />
                  <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue placeholder="Todas categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas categorias</SelectItem>
                      {categories.filter(c => c.type !== 'rail').map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-background border rounded-lg overflow-hidden group">
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      {product.image_url && productThumbnailUrls[product.image_url] ? (
                        <img 
                          src={productThumbnailUrls[product.image_url]} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-3xl">📷</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{getCategoryName(product.category_id)}</p>
                      <p className="text-sm sm:text-base font-bold text-primary mt-1">R$ {product.price}</p>
                      <div className="flex gap-1 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditProduct(product)}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {products.length === 0 ? "Nenhum produto cadastrado" : "Nenhum produto encontrado com os filtros selecionados"}
                </p>
              )}
            </div>

            {/* Dialog de Edição de Produto */}
            <Dialog open={editProductDialogOpen} onOpenChange={setEditProductDialogOpen}>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Produto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editProductName" className="text-sm">Nome do Produto</Label>
                      <Input
                        id="editProductName"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="editProductPrice" className="text-sm">Preço (R$)</Label>
                      <Input
                        id="editProductPrice"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editProductDescription" className="text-sm">Descrição</Label>
                    <Textarea
                      id="editProductDescription"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editProductCategory" className="text-sm">Categoria</Label>
                      <Select
                        value={productForm.category_id}
                        onValueChange={(value) => setProductForm({ ...productForm, category_id: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.type !== 'rail').map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="editProductInstallments" className="text-sm">Máx. Parcelas</Label>
                      <Input
                        id="editProductInstallments"
                        type="number"
                        min="1"
                        max="48"
                        value={productForm.max_installments}
                        onChange={(e) => setProductForm({ ...productForm, max_installments: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="editProductSizes" className="text-sm">Tamanhos (opcional)</Label>
                    <Input
                      id="editProductSizes"
                      value={productForm.sizes.join(', ')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const sizes = raw.split(',').map(s => s.trim());
                        setProductForm({ ...productForm, sizes });
                      }}
                      onBlur={() => {
                        const cleaned = productForm.sizes.filter(s => s.length > 0);
                        setProductForm({ ...productForm, sizes: cleaned });
                      }}
                      placeholder="Ex: P, M, G, GG"
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Separe por vírgula. Deixe vazio se não houver tamanhos.</p>
                  </div>

                  {productForm.price && parseFloat(productForm.price) > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Pré-visualização:</p>
                      <p className="text-sm text-muted-foreground">
                        {productForm.max_installments || 10}x de R${(parseFloat(productForm.price) / parseInt(productForm.max_installments || '10')).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-lg font-semibold" style={{ color: siteSettings?.primary_color || '#9f9f9f' }}>
                        R${parseFloat(productForm.price).toFixed(2).replace('.', ',')} no pix
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="editProductImage" className="text-sm">Adicionar Mais Imagens</Label>
                    <Input
                      id="editProductImage"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="cursor-pointer mt-1"
                    />
                  </div>

                  {imagePreviews.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Arraste para definir a imagem principal (primeira posição)</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {imagePreviews.map((preview, index) => (
                          <div 
                            key={index} 
                            className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border cursor-move ${draggedImageIndex === index ? 'opacity-50 border-primary' : 'border-border'}`}
                            draggable
                            onDragStart={(e) => handleImageDragStart(e, index)}
                            onDragOver={handleImageDragOver}
                            onDrop={(e) => handleImageDrop(e, index)}
                            onDragEnd={handleImageDragEnd}
                          >
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                            {index === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] text-center py-0.5">
                                Principal
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={handleCancelEditProduct} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* CATEGORIAS */}
          <TabsContent value="categories" className="space-y-4">
            <form onSubmit={handleAddCategory} className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 bg-card rounded-lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold mb-3 sm:mb-4">
                Adicionar Categoria
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="categoryName" className="text-sm">Nome</Label>
                  <Input
                    id="categoryName"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="categorySlug" className="text-sm">Slug</Label>
                  <Input
                    id="categorySlug"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="Ex: veus-de-renda"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="categoryLink" className="text-sm">Link Externo (opcional)</Label>
                <Input
                  id="categoryLink"
                  type="url"
                  value={categoryForm.link_url}
                  onChange={(e) => setCategoryForm({ ...categoryForm, link_url: e.target.value })}
                  placeholder="https://exemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="categoryType" className="text-sm">Tipo</Label>
                <select
                  id="categoryType"
                  value={categoryForm.type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'product' | 'rail' })}
                  className="w-full mt-1 border border-input bg-background px-3 py-2 rounded-md text-sm"
                >
                  <option value="product">Categoria de Produto (barra de busca)</option>
                  <option value="rail">Categoria do Trilho (homepage)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="categoryImage" className="text-sm">Ícone/Imagem (opcional)</Label>
                <div className="flex items-center gap-3 mt-1">
                  {categoryForm.image_url && (
                    <img
                      src={categoryForm.image_url}
                      alt="Pré-visualização"
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                  )}
                  <Input
                    id="categoryImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setCategoryForm({ ...categoryForm, image_url: ev.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1"
                  />
                  {categoryForm.image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategoryForm({ ...categoryForm, image_url: "" })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Adicionar
              </Button>
            </form>

            <div className="bg-card rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-lg sm:text-xl font-serif font-semibold mb-2">Categorias de Produto ({categories.filter(c => c.type !== 'rail').length})</h3>
              <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Aparecem na barra de busca dos produtos</p>
              
              <div className="space-y-2">
                {categories.filter(c => c.type !== 'rail').map((category, index) => (
                  <div 
                    key={category.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, category.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, category.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 sm:p-3 border rounded-lg ${draggedCategory === category.id ? 'opacity-50 bg-muted' : 'bg-background'}`}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hidden sm:flex"
                        onClick={() => handleMoveCategoryUp(category.id)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hidden sm:flex"
                        onClick={() => handleMoveCategoryDown(category.id)}
                        disabled={index === categories.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </div>
                    
                    <div className="flex items-center gap-1 sm:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveCategoryUp(category.id)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleMoveCategoryDown(category.id)}
                        disabled={index === categories.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {category.link_url || category.slug || '-'}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {categories.filter(c => c.type !== 'rail').length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma categoria de produto</p>
              )}
            </div>

            <div className="bg-card rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-lg sm:text-xl font-serif font-semibold mb-2">Categorias do Trilho ({categories.filter(c => c.type === 'rail').length})</h3>
              <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Aparecem no carrossel de categorias da homepage</p>
              
              <div className="space-y-2">
                {categories.filter(c => c.type === 'rail').map((category, index) => (
                  <div 
                    key={category.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, category.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, category.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 sm:p-3 border rounded-lg ${draggedCategory === category.id ? 'opacity-50 bg-muted' : 'bg-background'}`}
                  >
                    {category.image_url && (
                      <img src={category.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{category.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {category.link_url || category.slug || '-'}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {categories.filter(c => c.type === 'rail').length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma categoria do trilho</p>
              )}
            </div>

            <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCategory} className="space-y-3">
                  <div>
                    <Label htmlFor="editCategoryName" className="text-sm">Nome</Label>
                    <Input
                      id="editCategoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editCategorySlug" className="text-sm">Slug</Label>
                    <Input
                      id="editCategorySlug"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                      placeholder="Ex: veus-de-renda"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editCategoryLink" className="text-sm">Link Externo</Label>
                    <Input
                      id="editCategoryLink"
                      type="url"
                      value={categoryForm.link_url}
                      onChange={(e) => setCategoryForm({ ...categoryForm, link_url: e.target.value })}
                      placeholder="https://exemplo.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="editCategoryType" className="text-sm">Tipo</Label>
                    <select
                      id="editCategoryType"
                      value={categoryForm.type}
                      onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'product' | 'rail' })}
                      className="w-full mt-1 border border-input bg-background px-3 py-2 rounded-md text-sm"
                    >
                      <option value="product">Categoria de Produto (barra de busca)</option>
                      <option value="rail">Categoria do Trilho (homepage)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="editCategoryImage" className="text-sm">Ícone/Imagem</Label>
                    <div className="flex items-center gap-3 mt-1">
                      {categoryForm.image_url && (
                        <img
                          src={categoryForm.image_url}
                          alt="Pré-visualização"
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                      )}
                      <Input
                        id="editCategoryImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setCategoryForm({ ...categoryForm, image_url: ev.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="flex-1"
                      />
                      {categoryForm.image_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCategoryForm({ ...categoryForm, image_url: "" })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={handleCancelEditCategory} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Salvar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* CARROSSEL */}
          <TabsContent value="carousel" className="space-y-4">
            <form onSubmit={handleAddCarouselImage} className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 bg-card rounded-lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold mb-3 sm:mb-4">
                {editingCarouselImage ? "Editar Imagem do Carrossel" : "Adicionar Imagem ao Carrossel"}
              </h2>

              <div>
                <Label htmlFor="carouselImage" className="text-sm">Imagem</Label>
                <Input
                  id="carouselImage"
                  type="file"
                  accept="image/*"
                  onChange={handleCarouselImageSelect}
                  className="cursor-pointer mt-1"
                  required={!editingCarouselImage}
                />
              </div>

              {carouselImagePreview && (
                <div className="relative w-full max-w-md h-40 rounded-lg overflow-hidden border border-border">
                  <img src={carouselImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setCarouselImagePreview(null); setCarouselForm({ ...carouselForm, image: null }); }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="carouselTitle" className="text-sm">Título (opcional)</Label>
                  <Input
                    id="carouselTitle"
                    value={carouselForm.title}
                    onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                    placeholder="Texto sobre a imagem"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="carouselLink" className="text-sm">Link (opcional)</Label>
                  <Input
                    id="carouselLink"
                    type="url"
                    value={carouselForm.link_url}
                    onChange={(e) => setCarouselForm({ ...carouselForm, link_url: e.target.value })}
                    placeholder="https://exemplo.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingCarouselImage ? "Atualizar" : "Adicionar"}
                </Button>
                {editingCarouselImage && (
                  <Button type="button" variant="outline" onClick={handleCancelEditCarouselImage} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                )}
              </div>
            </form>

            <div className="bg-card rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-lg sm:text-xl font-serif font-semibold mb-2">Imagens do Carrossel ({carouselImages.length})</h3>
              <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Use as setas para reordenar</p>

              <div className="space-y-3">
                {carouselImages.map((image, index) => (
                  <div key={image.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveCarouselImageUp(image.id)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveCarouselImageDown(image.id)}
                        disabled={index === carouselImages.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden border border-border">
                      <img src={carouselThumbnailUrls[image.image_url] || ""} alt={image.title || "Banner"} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{image.title || "Sem título"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {image.link_url || "Sem link"}
                      </p>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleEditCarouselImage(image)}>
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCarouselImage(image.id)}>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {carouselImages.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma imagem no carrossel</p>
              )}
            </div>
          </TabsContent>

          {/* INSTITUTIONAL BLOCKS */}
          <TabsContent value="institutional" className="space-y-4">
            <form onSubmit={handleAddInstitutionalBlock} className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 bg-card rounded-lg">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold mb-3 sm:mb-4">
                {editingInstitutionalBlock ? "Editar Bloco Institucional" : "Adicionar Bloco Institucional"}
              </h2>

              <div>
                <Label htmlFor="institutionalBlockImage" className="text-sm">Imagem</Label>
                <Input
                  id="institutionalBlockImage"
                  type="file"
                  accept="image/*"
                  onChange={handleInstitutionalBlockImageSelect}
                  className="cursor-pointer mt-1"
                  required={!editingInstitutionalBlock}
                />
              </div>

              {institutionalBlockImagePreview && (
                <div className="relative w-full max-w-md h-40 rounded-lg overflow-hidden border border-border">
                  <img src={institutionalBlockImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setInstitutionalBlockImagePreview(null); setInstitutionalBlockForm({ ...institutionalBlockForm, image: null }); }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="institutionalBlockTitle" className="text-sm">Título</Label>
                  <Input
                    id="institutionalBlockTitle"
                    value={institutionalBlockForm.title}
                    onChange={(e) => setInstitutionalBlockForm({ ...institutionalBlockForm, title: e.target.value })}
                    placeholder="Ex: Para as Irmãs"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="institutionalBlockLink" className="text-sm">Link (opcional)</Label>
                  <Input
                    id="institutionalBlockLink"
                    type="url"
                    value={institutionalBlockForm.link_url}
                    onChange={(e) => setInstitutionalBlockForm({ ...institutionalBlockForm, link_url: e.target.value })}
                    placeholder="https://exemplo.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingInstitutionalBlock ? "Atualizar" : "Adicionar"}
                </Button>
                {editingInstitutionalBlock && (
                  <Button type="button" variant="outline" onClick={handleCancelEditInstitutionalBlock} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                )}
              </div>
            </form>

            <div className="bg-card rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-lg sm:text-xl font-serif font-semibold mb-2">Blocos Institucionais ({institutionalBlocks.length})</h3>
              <p className="text-xs text-muted-foreground mb-3 sm:mb-4">Use as setas para reordenar. Estes blocos aparecem abaixo do carrossel na página inicial.</p>

              <div className="space-y-3">
                {institutionalBlocks.map((block, index) => (
                  <div key={block.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveInstitutionalBlockUp(block.id)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveInstitutionalBlockDown(block.id)}
                        disabled={index === institutionalBlocks.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden border border-border">
                      <img src={blockThumbnailUrls[block.image_url] || ""} alt={block.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{block.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {block.link_url || "Sem link"}
                      </p>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleEditInstitutionalBlock(block)}>
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteInstitutionalBlock(block.id)}>
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {institutionalBlocks.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">Nenhum bloco institucional adicionado</p>
              )}
            </div>
          </TabsContent>

          {/* WHATSAPP */}
          <TabsContent value="whatsapp" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulário de Configuração */}
              <div className="p-4 sm:p-6 bg-card rounded-lg space-y-4">
                <h2 className="text-lg sm:text-xl font-serif font-semibold">
                  Configurar Mensagem do WhatsApp
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure a mensagem que será enviada quando um cliente clicar para encomendar via WhatsApp.
                </p>

                <div>
                  <Label htmlFor="whatsappNumber" className="text-sm">Número do WhatsApp</Label>
                  <Input
                    id="whatsappNumber"
                    value={siteSettings.whatsapp_number}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp_number: e.target.value })}
                    placeholder="5511999999999"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Formato: código do país + DDD + número</p>
                </div>

                <div>
                  <Label htmlFor="whatsappTemplate" className="text-sm">Modelo da Mensagem</Label>
                  <Textarea
                    id="whatsappTemplate"
                    value={siteSettings.whatsapp_message_template}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp_message_template: e.target.value })}
                    rows={6}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                {/* Placeholders */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Variáveis disponíveis:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono border">{'{produto}'}</code>
                      <span className="text-muted-foreground">→ Nome do produto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono border">{'{quantidade}'}</code>
                      <span className="text-muted-foreground">→ Qtd. escolhida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono border">{'{tamanho}'}</code>
                      <span className="text-muted-foreground">→ Tamanho (se houver)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-1.5 py-0.5 rounded text-[11px] font-mono border">{'{preco}'}</code>
                      <span className="text-muted-foreground">→ Preço final</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await updateSiteSettings(siteSettings);
                      toast({ title: "Configurações do WhatsApp salvas!" });
                    } catch (err: any) {
                      toast({ title: "Erro", description: err.message, variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar Configurações
                </Button>
              </div>

              {/* Preview - Celular com WhatsApp */}
              <div className="flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Pré-visualização:</p>
                
                {/* Celular */}
                <div className="relative w-[280px] h-[560px] bg-[#1a1a2e] rounded-[36px] p-[10px] shadow-2xl border-4 border-gray-700">
                  {/* Tela */}
                  <div className="w-full h-full bg-[#e5ddd5] rounded-[28px] overflow-hidden flex flex-col">
                    
                    {/* Barra superior WhatsApp */}
                    <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                      </svg>
                      <div className="w-8 h-8 rounded-full bg-[#075e54] flex items-center justify-center border border-white/30">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                      </div>
                      <div className="flex-1 ml-1">
                        <p className="text-white text-xs font-medium">Fabiana Designs</p>
                        <p className="text-white/60 text-[9px]">online</p>
                      </div>
                      <div className="flex gap-3">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        </svg>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Área de mensagens */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}>
                      {/* Mensagem do WhatsApp */}
                      <div className="flex justify-end">
                        <div className="bg-[#dcf8c6] rounded-lg rounded-tr-sm p-2.5 max-w-[85%] shadow-sm relative">
                          {/* Seta da mensagem */}
                          <div className="absolute top-0 right-[-6px] w-0 h-0 border-t-[6px] border-t-[#dcf8c6] border-l-[6px] border-l-transparent border-r-0 border-b-0" />
                          
                          {/* Conteúdo da mensagem */}
                          <div className="text-[11px] text-[#303030] leading-relaxed whitespace-pre-line">
                            {(() => {
                              const template = siteSettings.whatsapp_message_template || 'Olá! Gostaria de encomendar:\n\n*{produto}*\nQuantidade: {quantidade}{tamanho}Preço: R$ {preco}';
                              const exampleMessage = template
                                .replace('{produto}', 'Vestido de Renda Dourada')
                                .replace('{quantidade}', '1')
                                .replace('{tamanho}', '\nTamanho: M\n')
                                .replace('{preco}', '189,90');
                              
                              // Renderizar com negrito para texto entre *
                              return exampleMessage.split('\n').map((line, i) => {
                                if (line.includes('*')) {
                                  const parts = line.split('*');
                                  return (
                                    <div key={i}>
                                      {parts.map((part, j) => 
                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                      )}
                                    </div>
                                  );
                                }
                                return <div key={i}>{line}</div>;
                              });
                            })()}
                          </div>
                          
                          {/* Hora da mensagem */}
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[9px] text-[#8696a0]">14:32</span>
                            <svg className="w-3 h-3 text-[#53bdeb]" viewBox="0 0 16 11" fill="currentColor">
                              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.46.46 0 0 0-.659-.003.464.464 0 0 0-.003.66l2.407 2.507a.46.46 0 0 0 .662.031l6.566-8.103a.448.448 0 0 0-.087-.709z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barra inferior */}
                    <div className="bg-[#f0f0f0] px-2 py-2 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.5 11c.83 0 1.5-.67 1.5-1.5S10.33 8 9.5 8 8 8.67 8 9.5 8.67 11 9.5 11zm5 0c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5zm4.5 1.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                      </div>
                      <div className="flex-1 bg-white rounded-full px-3 py-1.5">
                        <span className="text-[10px] text-[#8696a0]">Digite uma mensagem</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#075e54] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Notch */}
                  <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl" />
                </div>

                <p className="text-[10px] text-muted-foreground mt-3 text-center max-w-[260px]">
                  Assim o cliente verá a mensagem ao clicar em "Encomendar"
                </p>
              </div>
            </div>
          </TabsContent>

          {/* PERSONALIZAR */}
          <TabsContent value="settings" className="space-y-4">
            <div className="p-3 sm:p-4 md:p-6 bg-card rounded-lg space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-semibold">
                Personalizar Site
              </h2>

              {/* Banner */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Banner Superior</h3>
                <div>
                  <Label htmlFor="bannerText" className="text-sm">Texto do Banner</Label>
                  <Input
                    id="bannerText"
                    value={siteSettings.banner_text}
                    onChange={(e) => setSiteSettings({ ...siteSettings, banner_text: e.target.value })}
                    placeholder="FRETE GRÁTIS A PARTIR DE R$199,00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bannerColor" className="text-sm">Cor de Fundo do Banner</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="bannerColor"
                      type="color"
                      value={siteSettings.banner_color}
                      onChange={(e) => setSiteSettings({ ...siteSettings, banner_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={siteSettings.banner_color}
                      onChange={(e) => setSiteSettings({ ...siteSettings, banner_color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg text-white text-sm text-center" style={{ backgroundColor: siteSettings.banner_color }}>
                  {siteSettings.banner_text || 'Preview do banner'}
                </div>
              </div>

              <hr className="border-border" />

              {/* WhatsApp */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">WhatsApp</h3>
                <div>
                  <Label htmlFor="whatsappNumber" className="text-sm">Número do WhatsApp (com código do país)</Label>
                  <Input
                    id="whatsappNumber"
                    value={siteSettings.whatsapp_number}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp_number: e.target.value })}
                    placeholder="5511999999999"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Formato: código do país + DDD + número (ex: 5511999999999)</p>
                </div>
              </div>

              <hr className="border-border" />

              {/* Cores */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Cores do Site</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="text-sm">Cor Primária</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={siteSettings.primary_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={siteSettings.primary_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-sm">Cor Secundária</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={siteSettings.secondary_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, secondary_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={siteSettings.secondary_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, secondary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor" className="text-sm">Cor de Destaque</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="accentColor"
                        type="color"
                        value={siteSettings.accent_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, accent_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={siteSettings.accent_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, accent_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[100px] p-3 rounded-lg text-center text-sm" style={{ backgroundColor: siteSettings.primary_color, color: 'white' }}>
                    Primária
                  </div>
                  <div className="flex-1 min-w-[100px] p-3 rounded-lg text-center text-sm border" style={{ backgroundColor: siteSettings.secondary_color }}>
                    Secundária
                  </div>
                  <div className="flex-1 min-w-[100px] p-3 rounded-lg text-center text-sm" style={{ backgroundColor: siteSettings.accent_color, color: 'white' }}>
                    Destaque
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              {/* Botão de Compra */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Botão de Compra</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonText" className="text-sm">Texto do Botão</Label>
                    <Input
                      id="buttonText"
                      value={siteSettings.button_text}
                      onChange={(e) => setSiteSettings({ ...siteSettings, button_text: e.target.value })}
                      placeholder="Comprar"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buttonColor" className="text-sm">Cor do Botão</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="buttonColor"
                        type="color"
                        value={siteSettings.button_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, button_color: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={siteSettings.button_color}
                        onChange={(e) => setSiteSettings({ ...siteSettings, button_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonSize" className="text-sm">Tamanho do Botão</Label>
                    <select
                      id="buttonSize"
                      value={siteSettings.button_size || 'md'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, button_size: e.target.value as 'sm' | 'md' | 'lg' })}
                      className="w-full mt-1 border border-input bg-background px-3 py-2 rounded-md text-sm"
                    >
                      <option value="sm">Pequeno</option>
                      <option value="md">Médio</option>
                      <option value="lg">Grande</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="buttonRadius" className="text-sm">Arredondamento do Botão (px)</Label>
                    <Input
                      id="buttonRadius"
                      type="number"
                      min="0"
                      max="9999"
                      value={siteSettings.button_border_radius || '4'}
                      onChange={(e) => setSiteSettings({ ...siteSettings, button_border_radius: e.target.value })}
                      placeholder="4"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    className="px-6 py-2 text-sm font-medium text-white"
                    style={{
                      backgroundColor: siteSettings.button_color,
                      borderRadius: `${siteSettings.button_border_radius || '4'}px`,
                    }}
                  >
                    {siteSettings.button_text || 'Comprar'}
                  </button>
                </div>
              </div>

              <Button 
                onClick={async () => {
                  await updateSiteSettings(siteSettings);
                  toast({ title: "Configurações salvas!" });
                }} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>

          {/* TESTE CONEXÃO */}
          <TabsContent value="teste" className="space-y-4">
            <TestConnections />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
