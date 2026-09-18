import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Product, getProductImagesByProductId } from "@/lib/localStorage";
import { getImageFromIDB } from "@/lib/imageStorage";

interface SearchBarProps {
  products: Product[];
  onClose: () => void;
}

const SearchBar = ({ products, onClose }: SearchBarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? products
        .filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : [];

  const handleSelect = (productId: string) => {
    navigate(`/produto/${productId}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[focusedIndex].id);
    }
  };

  const getProductImage = (product: Product) => {
    const images = getProductImagesByProductId(product.id);
    const imageId = images.length > 0 ? images[0].image_url : product.image_url;
    if (!imageId) return "";
    return imageUrls[imageId] || "";
  };

  useEffect(() => {
    if (filtered.length === 0) return;
    let cancelled = false;
    const loadImages = async () => {
      for (const product of filtered) {
        if (imageUrls[product.image_url]) continue;
        const images = getProductImagesByProductId(product.id);
        const imageId = images.length > 0 ? images[0].image_url : product.image_url;
        if (!imageId || imageUrls[imageId]) continue;
        try {
          const url = await getImageFromIDB(imageId);
          if (!cancelled && url) {
            setImageUrls(prev => ({ ...prev, [imageId]: url }));
          }
        } catch { /* ignore */ }
      }
    };
    loadImages();
    return () => { cancelled = true; };
  }, [query]);

  const formatPrice = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;

  return (
    <div className="w-full bg-background border-b border-border shadow-md relative z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar produtos..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10 py-6 text-base md:text-lg border-2 border-border focus-visible:ring-0 focus-visible:border-primary"
          />
          <button
            onClick={onClose}
            className="absolute right-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {isOpen && query.trim() && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 mx-4 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[60vh] overflow-y-auto"
          >
            {filtered.length > 0 ? (
              <ul className="py-2">
                {filtered.map((product, index) => (
                  <li
                    key={product.id}
                    onClick={() => handleSelect(product.id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      index === focusedIndex
                        ? "bg-muted"
                        : "hover:bg-muted"
                    }`}
                  >
                    <img
                      src={getProductImage(product) || ""}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
