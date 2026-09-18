import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getValidCoupon } from "@/lib/localStorage";
import { useImageUrl } from "@/hooks/use-image-url";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDetailDialog = ({ product, open, onOpenChange }: ProductDetailDialogProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const { toast } = useToast();
  const imageUrl = useImageUrl(product?.image_url);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Erro",
        description: "Digite um código de cupom",
        variant: "destructive",
      });
      return;
    }

    const coupon = getValidCoupon(couponCode.trim());

    if (!coupon) {
      toast({
        title: "Cupom inválido",
        description: "Cupom não encontrado ou expirado",
        variant: "destructive",
      });
      return;
    }

    setDiscount(coupon.discount_percentage);
    toast({
      title: "Cupom aplicado!",
      description: `Desconto de ${coupon.discount_percentage}% aplicado`,
    });
  };

  const calculateFinalPrice = () => {
    if (!product) return 0;
    return product.price * (1 - discount / 100);
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    
    const finalPrice = calculateFinalPrice();
    const message = `Olá! Gostaria de encomendar:\n\n*${product.name}*\n${product.description || ''}\n\nPreço: R$ ${finalPrice.toFixed(2)}${discount > 0 ? ` (com ${discount}% de desconto)` : ''}`;
    
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">Sem imagem</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground mb-2">{product.description}</p>
              <p className="text-3xl font-serif font-bold text-primary">
                R$ {calculateFinalPrice().toFixed(2)}
              </p>
              {discount > 0 && (
                <p className="text-sm text-muted-foreground line-through">
                  R$ {product.price.toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon">Cupom de Desconto</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="Digite o código"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="uppercase"
                />
                <Button onClick={handleApplyCoupon} variant="outline">
                  Aplicar
                </Button>
              </div>
            </div>

            <Button onClick={handleWhatsAppOrder} className="w-full" size="lg">
              Encomendar no WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
