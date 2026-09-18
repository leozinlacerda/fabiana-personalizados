import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Product, Category } from "@/lib/localStorage";

interface FilterState {
  selectedCategories: string[];
  selectedSizes: string[];
  minPrice: string;
  maxPrice: string;
}

interface FilterSidebarProps {
  products: Product[];
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const AccordionSection = ({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {title}
        </h3>
        <span className="lg:hidden text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      <div className={`${open ? "block" : "hidden"} lg:block`}>
        {children}
      </div>
    </div>
  );
};

const FilterContent = ({ products, categories, filters, onFiltersChange }: FilterSidebarProps) => {
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice);

  const productCategories = useMemo(
    () => categories.filter((c) => c.type === "product"),
    [categories]
  );

  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category_id) {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const availableSizes = useMemo(() => {
    const sizeMap: Record<string, number> = {};
    products.forEach((p) => {
      if (p.sizes) {
        p.sizes.forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) {
            sizeMap[trimmed] = (sizeMap[trimmed] || 0) + 1;
          }
        });
      }
    });
    const sizeOrder = ["PP", "P", "M", "G", "GG", "XG", "XXG"];
    return Object.entries(sizeMap).sort(([a], [b]) => {
      const ai = sizeOrder.indexOf(a.toUpperCase());
      const bi = sizeOrder.indexOf(b.toUpperCase());
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [products]);

  const toggleCategory = (categoryId: string) => {
    const next = filters.selectedCategories.includes(categoryId)
      ? filters.selectedCategories.filter((id) => id !== categoryId)
      : [...filters.selectedCategories, categoryId];
    onFiltersChange({ ...filters, selectedCategories: next });
  };

  const toggleSize = (size: string) => {
    const next = filters.selectedSizes.includes(size)
      ? filters.selectedSizes.filter((s) => s !== size)
      : [...filters.selectedSizes, size];
    onFiltersChange({ ...filters, selectedSizes: next });
  };

  const applyPrice = () => {
    onFiltersChange({
      ...filters,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
    });
  };

  return (
    <>
      {/* Categories */}
      <AccordionSection title="Categorias" defaultOpen={true}>
        <div className="space-y-2">
          {productCategories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Checkbox
                checked={filters.selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {cat.name}
                {categoryProductCounts[cat.id] != null && (
                  <span className="ml-1">({categoryProductCounts[cat.id]})</span>
                )}
              </span>
            </label>
          ))}
          {productCategories.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhuma categoria disponível</p>
          )}
        </div>
      </AccordionSection>

      {/* Sizes */}
      <AccordionSection title="Tamanho" defaultOpen={true}>
        <div className="space-y-2">
          {availableSizes.map(([size, count]) => (
            <label
              key={size}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Checkbox
                checked={filters.selectedSizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {size} ({count})
              </span>
            </label>
          ))}
          {availableSizes.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum tamanho disponível</p>
          )}
        </div>
      </AccordionSection>

      {/* Price Range */}
      <AccordionSection title="Preço" defaultOpen={true}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">De</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="Mínimo"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Até</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="Máximo"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={applyPrice}
            className="w-full text-xs"
          >
            Aplicar
          </Button>
        </div>
      </AccordionSection>
    </>
  );
};

const FilterSidebar = ({ products, categories, filters, onFiltersChange }: FilterSidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtrar
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Filtrar</SheetTitle>
            </SheetHeader>
            <FilterContent
              products={products}
              categories={categories}
              filters={filters}
              onFiltersChange={(f) => {
                onFiltersChange(f);
                setOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 pr-8 border-r border-border flex-shrink-0">
        <FilterContent
          products={products}
          categories={categories}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </aside>
    </>
  );
};

export type { FilterState };
export default FilterSidebar;
