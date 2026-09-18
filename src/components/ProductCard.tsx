import { useEffect, useState } from "react";
import { getSiteSettings, SiteSettings } from "@/lib/localStorage";
import { useImageUrl } from "@/hooks/use-image-url";

interface ProductCardProps {
  title: string;
  image: string;
  secondImage?: string | null;
  price: number;
  maxInstallments?: number;
}

const ProductCard = ({ title, image, secondImage, price, maxInstallments = 10 }: ProductCardProps) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mainUrl = useImageUrl(image);
  const secondUrl = useImageUrl(secondImage);

  useEffect(() => {
    setSettings(getSiteSettings());
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const hasSecondImage = secondUrl && secondUrl !== mainUrl;

  const formatPrice = (value: number) =>
    `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square overflow-hidden bg-gray-50 mb-2 relative">
        <img
          src={mainUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
          style={{ opacity: hasSecondImage && isHovered ? 0 : 1 }}
        />
        {hasSecondImage && (
          <img
            src={secondUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out"
            style={{ opacity: isHovered ? 1 : 0 }}
          />
        )}
      </div>
      <div className="mb-1">
        <h3 className="text-[13px] text-gray-800 leading-tight line-clamp-2 mb-1">{title}</h3>
        <p className="text-[15px] font-bold text-gray-900">{formatPrice(price)}</p>
      </div>
      <div className="h-[30px] relative">
        {settings && (
          <button
            className="absolute inset-0 w-full py-1.5 px-2 text-[11px] font-medium text-white transition-opacity duration-300 hover:opacity-90"
            style={{
              backgroundColor: settings.button_color || '#1f7a4d',
              borderRadius: `${settings.button_border_radius || '4'}px`,
              opacity: isMobile ? 1 : (isHovered ? 1 : 0),
            }}
          >
            {settings.button_text || 'Comprar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
