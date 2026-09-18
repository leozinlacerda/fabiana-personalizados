import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryRail from "@/components/CategoryRail";
import InstitutionalBlocks from "@/components/InstitutionalBlocks";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { NavLink } from "@/components/NavLink";
import ProductCard from "@/components/ProductCard";
import { getProducts, getSiteSettings, getProductImagesByProductId, Product, SiteSettings } from "@/lib/localStorage";

interface ProductWithImages extends Product {
  secondImage?: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    loadProducts();
    loadSettings();
  }, []);

  const loadProducts = () => {
    const data = getProducts().slice(0, 6);
    // Fetch images for each product
    const productsWithImages = data.map(product => {
      const images = getProductImagesByProductId(product.id);
      return {
        ...product,
        secondImage: images.length > 1 ? images[1].image_url : null,
      };
    });
    setProducts(productsWithImages);
  };

  const loadSettings = () => {
    setSettings(getSiteSettings());
  };

  const handleProductClick = (productId: string) => {
    navigate(`/produto/${productId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top promotional bar with scrolling text */}
      {settings && (
        <div className="text-primary-foreground py-2 overflow-hidden relative shadow-2xl" style={{ backgroundColor: settings.banner_color }}>
          <div className="animate-scroll-left whitespace-nowrap inline-block">
            <span className="text-sm mx-8">{settings.banner_text}</span>
            <span className="text-sm mx-8">{settings.banner_text}</span>
            <span className="text-sm mx-8">{settings.banner_text}</span>
            <span className="text-sm mx-8">{settings.banner_text}</span>
          </div>
        </div>
      )}
      
      <Header />
      
      <main>
        {/* Hero Carousel */}
        <HeroCarousel />

        {/* Category Rail */}
        <CategoryRail />

        {/* Featured Products */}
        {products.length > 0 && (
          <section className="py-10 container mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <h2 className="text-sm font-light tracking-widest text-gray-400 uppercase">Destaques</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
              {products.map(product => (
                <div key={product.id} onClick={() => handleProductClick(product.id)}>
                  <ProductCard
                    title={product.name}
                    image={product.image_url || ""}
                    secondImage={product.secondImage}
                    price={product.price}
                    maxInstallments={product.max_installments || 10}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Institutional Blocks (Irmãs, Irmãos, etc) */}
        <InstitutionalBlocks />
      </main>

      <Footer />

      <WhatsAppButton />
    </div>
  );
};

export default Home;
