import { useState, useEffect, useCallback } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getCarouselImages, CarouselImage } from "@/lib/localStorage";
import { getMultipleImagesFromIDB } from "@/lib/imageStorage";

const HeroCarousel = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const loaded = getCarouselImages();
    setImages(loaded);
    getMultipleImagesFromIDB(loaded.map(img => img.image_url)).then(setImageUrls);
  }, []);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  useEffect(() => {
    if (!api || images.length <= 1) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api, images.length]);

  if (images.length === 0) {
    return (
      <section className="relative h-[30vh] sm:h-[50vh] md:h-[70vh] max-h-[600px] bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Adicione imagens no painel administrativo</p>
      </section>
    );
  }

  const handleClick = (linkUrl: string) => {
    if (linkUrl) {
      window.open(linkUrl, "_blank");
    }
  };

  return (
    <section className="relative w-full">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={image.id}>
              <div
                className={`relative w-full h-[30vh] sm:h-[50vh] md:h-[70vh] max-h-[600px] overflow-hidden ${image.link_url ? "cursor-pointer" : ""}`}
                onClick={() => handleClick(image.link_url)}
              >
                <img
                  src={imageUrls[index] || ""}
                  alt={image.title || "Banner"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {image.title && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg text-center px-4">
                      {image.title}
                    </h2>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2 md:left-4 bg-white/80 hover:bg-white text-foreground border-none h-10 w-10 md:h-12 md:w-12" />
            <CarouselNext className="right-2 md:right-4 bg-white/80 hover:bg-white text-foreground border-none h-10 w-10 md:h-12 md:w-12" />
          </>
        )}
      </Carousel>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                current === index ? "bg-white w-6" : "bg-white/50"
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;
