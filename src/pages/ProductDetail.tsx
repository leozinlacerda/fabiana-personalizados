import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronUp, ChevronDown, Plus, Minus, Truck, CreditCard, Share2, Facebook, Twitter, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProductById, getProductImagesByProductId, getSiteSettings, getProducts, getCategories, Product, ProductImage, SiteSettings, Category } from "@/lib/db";
import Lightbox from "@/components/Lightbox";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    getSiteSettings().then(setSiteSettings);
    getCategories().then(setCategories);
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    const productData = await getProductById(id);
    
    if (!productData) {
      toast({
        title: "Erro",
        description: "Produto não encontrado",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setProduct(productData);
    const images = await getProductImagesByProductId(id);
    setProductImages(images);
    
    const allIds = images.length > 0
      ? images.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url)
      : (productData.image_url ? [productData.image_url] : []);

    setImageUrls(allIds);
    
    if (allIds.length > 0) {
      setSelectedImage(allIds[0]);
      setSelectedImageIndex(0);
    } else {
      setSelectedImage("");
    }

    const allProducts = await getProducts();
    const related = allProducts
      .filter(p => p.id !== id && p.category_id === productData.category_id)
      .slice(0, 8);
    setRelatedProducts(related);
  };

  const calculateFinalPrice = () => {
    if (!product) return 0;
    return product.price;
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    
    const finalPrice = calculateFinalPrice();
    const productLink = `${window.location.origin}/produto/${product.id}`;
    const categoryName = categories.find(c => c.id === product.category_id)?.name || '';
    
    // Use the template from settings if available
    const template = siteSettings?.whatsapp_message_template || 'Olá! Gostaria de encomendar:\n\n*{produto}*\nQuantidade: {quantidade}{tamanho}Preço: R$ {valor_final}\n\nLink do produto: {link}';
    
    const message = template
      .replace('{produto}', product.name)
      .replace('{quantidade}', quantity.toString())
      .replace('{tamanho}', selectedSize ? `\nTamanho: ${selectedSize}\n` : '\n')
      .replace('{valor_final}', (finalPrice * quantity).toFixed(2))
      .replace('{link}', productLink)
      .replace('{categoria}', categoryName)
      .replace('{descricao}', product.description || '');
    
    const whatsappNumber = (siteSettings?.whatsapp_number || '5511999999999').replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product?.name || '')}`, '_blank');
  };

  const images = productImages.length > 0
    ? productImages.sort((a, b) => a.display_order - b.display_order).map(img => img.image_url)
    : (product?.image_url ? [product.image_url] : []);

  const handlePrevImage = () => {
    if (images.length > 0) {
      const newIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  const handleNextImage = () => {
    if (images.length > 0) {
      const newIndex = selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
    setSelectedImage(images[index]);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-400 font-light">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-['Outfit']">
      <Header />
      
      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="text-[11px] text-gray-400 mb-4 flex items-center gap-1.5">
          <span className="hover:text-black cursor-pointer transition-colors" onClick={() => navigate('/')}>Início</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Left side - Image Gallery */}
          <div className="flex gap-4 lg:w-[60%]">
            {/* Thumbnail column */}
            <div className="hidden md:flex flex-col items-center w-14 flex-shrink-0 gap-1">
              <button 
                onClick={handlePrevImage}
                className="w-full flex justify-center py-1 text-gray-300 hover:text-black transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[420px]">
                {images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelect(index)}
                    className={`w-12 h-14 rounded overflow-hidden border transition-all flex-shrink-0 ${
                      selectedImageIndex === index 
                        ? 'border-black' 
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <img src={imageUrls[index] || ""} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <button 
                onClick={handleNextImage}
                className="w-full flex justify-center py-1 text-gray-300 hover:text-black transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Main image */}
            <div className="flex-1 relative">
              <div
                className="aspect-square overflow-hidden bg-gray-50 cursor-zoom-in"
                onClick={() => { setLightboxIndex(selectedImageIndex); setLightboxOpen(true); }}
              >
                {selectedImage && imageUrls[selectedImageIndex] ? (
                  <img src={imageUrls[selectedImageIndex]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Mobile thumbnails */}
              <div className="flex md:hidden gap-1.5 mt-3 overflow-x-auto pb-2">
                {images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelect(index)}
                    className={`w-10 h-12 rounded overflow-hidden border transition-all flex-shrink-0 ${
                      selectedImageIndex === index ? 'border-black' : 'border-gray-100'
                    }`}
                  >
                    <img src={imageUrls[index] || ""} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Product Info */}
          <div className="flex-1 lg:w-[40%]">
            {/* Title */}
            <h1 className="text-[22px] md:text-[26px] font-medium text-black mb-2 leading-tight">
              {product.name}
            </h1>
            
            {/* Price */}
            <div className="mb-4">
              <p className="text-[26px] font-semibold text-black">
                R${calculateFinalPrice().toFixed(2).replace('.', ',')}
              </p>
              {product.max_installments && product.max_installments > 1 && (
                <p className="text-[11px] text-gray-400 mt-1">
                  ou {product.max_installments}x de R${(calculateFinalPrice() / product.max_installments).toFixed(2).replace('.', ',')} sem juros
                </p>
              )}
            </div>

            {/* Frete grátis */}
            <div className="flex items-center gap-1.5 text-green-600 mb-4">
              <Truck className="w-3.5 h-3.5" />
              <span className="text-[11px]">Frete grátis</span>
            </div>

            {/* Size selector - Only show if product has sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wide">Tamanho</p>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full h-10 text-sm border-gray-200 rounded">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity and Buy */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center border border-gray-200 rounded h-10">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-black text-sm">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <Button 
                onClick={handleWhatsAppOrder} 
                className="flex-1 h-10 text-[13px] font-medium text-white rounded"
                style={{ backgroundColor: siteSettings?.button_color || '#1f7a4d' }}
              >
                {siteSettings?.button_text || 'Comprar'}
              </Button>
            </div>

            {/* Free shipping message */}
            <p className="text-[11px] text-gray-400 mb-4">
              Adicione este produto e <span className="text-green-600">tenha frete grátis!</span>
            </p>

            {/* Meios de pagamento */}
            <Collapsible open={paymentOpen} onOpenChange={setPaymentOpen} className="border-t border-gray-100 py-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-green-600 transition-colors">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="text-[13px] font-medium">Meios de pagamento</span>
                </div>
                {paymentOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="space-y-2.5 text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">PIX</span>
                    </div>
                    <span className="text-gray-500">Até 10% de desconto no Pix</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-gray-300" />
                    <span className="text-gray-500">Até {product.max_installments || 10}x sem juros</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Meios de envio */}
            <Collapsible open={shippingOpen} onOpenChange={setShippingOpen} className="border-t border-gray-100 py-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-green-600 transition-colors">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5" />
                  <span className="text-[13px] font-medium">Meios de envio</span>
                </div>
                {shippingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="flex gap-2">
                  <Input placeholder="Digite seu CEP" className="flex-1 h-9 text-[12px] border-gray-200" />
                  <Button variant="outline" className="h-9 text-[12px] border-gray-200">Calcular</Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Descrição */}
            <div className="border-t border-gray-100 pt-4 mt-1">
              {product.description && (
                <div className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-line font-light">
                  {product.description}
                </div>
              )}
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <Share2 className="w-3.5 h-3.5 text-gray-300" />
              <button onClick={handleShareWhatsApp} className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button onClick={handleShareFacebook} className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                <Facebook className="w-3 h-3" />
              </button>
              <button onClick={handleShareTwitter} className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-white hover:bg-sky-600 transition-colors">
                <Twitter className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Que tal esses? */}
        {relatedProducts.length > 0 && (
          <section className="mt-14 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-100" />
              <h2 className="text-[13px] font-light tracking-[0.2em] text-gray-400 uppercase">Que tal esses?</h2>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
              {relatedProducts.map(relatedProduct => (
                <div
                  key={relatedProduct.id}
                  onClick={() => {
                    navigate(`/produto/${relatedProduct.id}`);
                    window.scrollTo(0, 0);
                  }}
                >
                  <ProductCard
                    title={relatedProduct.name}
                    image={relatedProduct.image_url || ""}
                    price={relatedProduct.price}
                    maxInstallments={relatedProduct.max_installments || 10}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <WhatsAppButton />

      <Lightbox
        images={imageUrls.filter(Boolean)}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
};

export default ProductDetail;