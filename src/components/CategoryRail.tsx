import { useEffect, useRef, useState } from "react";
import { getCategoriesByType, Category } from "@/lib/db";
import { useImageUrl } from "@/hooks/use-image-url";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CategoryItem = ({ category }: { category: Category }) => {
  const imageUrl = useImageUrl(category.image_url);

  return (
    <a
      href={category.link_url || `/categorias/${category.slug || category.id}`}
      className="flex flex-col items-center min-w-[70px] md:min-w-[80px] group"
    >
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-100 mb-1.5 border-2 border-transparent group-hover:border-gray-300 transition-all">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-light">
            {category.name.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-[10px] md:text-xs text-center text-gray-700 group-hover:text-gray-900 transition-colors line-clamp-2 leading-tight">
        {category.name}
      </span>
    </a>
  );
};

const CategoryRail = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    getCategoriesByType('rail').then(setCategories);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const checkScroll = () => {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    };
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 160;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <section className="py-4 md:py-5 bg-[#f5f5f5]">
      <div className="container mx-auto px-4 relative">
        {/* Desktop navigation arrows */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow -ml-1"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg transition-shadow -mr-1"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:snap-none px-1 py-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <div key={cat.id} className="snap-center shrink-0">
              <CategoryItem category={cat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryRail;
