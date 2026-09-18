import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import FilterSidebar, { FilterState } from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getProducts,
  getCategories,
  getProductImagesByProductId,
  Product,
  Category,
} from "@/lib/localStorage";

interface ProductWithImages extends Product {
  secondImage?: string | null;
}

const Veus = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortBy, setSortBy] = useState("best-selling");
  const [filters, setFilters] = useState<FilterState>({
    selectedCategories: [],
    selectedSizes: [],
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    const data = getProducts();
    const productsWithImages = data.map((product) => {
      const images = getProductImagesByProductId(product.id);
      return {
        ...product,
        secondImage: images.length > 1 ? images[1].image_url : null,
      };
    });
    setProducts(productsWithImages);
  };

  const loadCategories = () => {
    const data = getCategories();
    setCategories(data);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filters.selectedCategories.length > 0) {
      result = result.filter((p) =>
        filters.selectedCategories.includes(p.category_id || "")
      );
    }

    if (filters.selectedSizes.length > 0) {
      result = result.filter((p) => {
        if (!p.sizes) return false;
        return p.sizes.some((s) => filters.selectedSizes.includes(s.trim()));
      });
    }

    const minP = parseFloat(filters.minPrice);
    const maxP = parseFloat(filters.maxPrice);
    if (!isNaN(minP)) {
      result = result.filter((p) => p.price >= minP);
    }
    if (!isNaN(maxP)) {
      result = result.filter((p) => p.price <= maxP);
    }

    switch (sortBy) {
      case "price-ascending":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-descending":
        result.sort((a, b) => b.price - a.price);
        break;
      case "alpha-ascending":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "alpha-descending":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "created-descending":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "created-ascending":
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "best-selling":
      default:
        break;
    }

    return result;
  }, [products, sortBy, filters]);

  const handleProductClick = (productId: string) => {
    navigate(`/produto/${productId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
          <a href="/" className="hover:text-primary transition-colors">
            Início
          </a>
          <span>/</span>
          <span className="text-foreground">Véus</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Mobile filter button + title */}
          <div className="flex items-center justify-between lg:hidden mb-2">
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground">
              Véus
            </h2>
            <FilterSidebar
              products={products}
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar
              products={products}
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          <main className="flex-1">
            {/* Desktop sort + title */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-semibold text-foreground">
                Véus
              </h2>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Ordenar por
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-selling">Mais vendidos</SelectItem>
                    <SelectItem value="price-ascending">
                      Preço: menor ao maior
                    </SelectItem>
                    <SelectItem value="price-descending">
                      Preço: maior ao menor
                    </SelectItem>
                    <SelectItem value="alpha-ascending">A - Z</SelectItem>
                    <SelectItem value="alpha-descending">Z - A</SelectItem>
                    <SelectItem value="created-descending">
                      Mais novo ao mais antigo
                    </SelectItem>
                    <SelectItem value="created-ascending">
                      Mais antigo ao mais novo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile sort */}
            <div className="lg:hidden mb-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best-selling">Mais vendidos</SelectItem>
                  <SelectItem value="price-ascending">
                    Preço: menor ao maior
                  </SelectItem>
                  <SelectItem value="price-descending">
                    Preço: maior ao menor
                  </SelectItem>
                  <SelectItem value="alpha-ascending">A - Z</SelectItem>
                  <SelectItem value="alpha-descending">Z - A</SelectItem>
                  <SelectItem value="created-descending">
                    Mais novo ao mais antigo
                  </SelectItem>
                  <SelectItem value="created-ascending">
                    Mais antigo ao mais novo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                >
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum produto encontrado com os filtros selecionados.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      <WhatsAppButton />
    </div>
  );
};

export default Veus;
