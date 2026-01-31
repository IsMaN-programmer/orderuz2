import { X, Plus, Minus, Trash2, ShoppingBag, CreditCard, Clock, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CartDrawer Component
 * Implements a modern, glassmorphic sliding basket for OrderUZ.
 * Follows the 'Immersive Gastronomy' framework with high-energy primary colors
 * and technical monospaced pricing for precision.
 */
export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, isEmpty } = useCart();

  // Mock delivery metadata for Uzbekistan context
  const deliveryFee = isEmpty ? 0 : 5000; // 5,000 UZS
  const finalTotal = totalPrice + deliveryFee;
  const estimatedTime = "25-35 min";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md flex flex-col p-0 bg-background/95 backdrop-blur-2xl border-l border-border/40 shadow-2xl"
      >
        {/* Header Section */}
        <SheetHeader className="p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              Your Basket
              {!isEmpty && (
                <span className="ml-2 text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {totalItems} ITEMS
                </span>
              )}
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="rounded-full hover:bg-muted/80"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {!isEmpty && (
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-secondary" />
                {estimatedTime}
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full truncate max-w-[180px]">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                Tashkent, Central District
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Main Content Area */}
        <ScrollArea className="flex-1">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-10 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center border border-border/50 shadow-inner">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Hungry? Start adding!</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Browse through the tastiest videos and add your favorite Uzbek dishes to your basket.
                </p>
              </div>
              <Button 
                onClick={onClose} 
                className="w-full max-w-[200px] rounded-full font-bold shadow-lg shadow-primary/15"
              >
                Explore Food
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/20 px-6">
              {items.map((item) => (
                <div key={item.id} className="py-6 flex gap-4 group animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Item Image */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm tracking-tight truncate leading-none">
                          {item.name}
                        </h4>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 -mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-primary font-mono text-sm font-semibold">
                        {item.price.toLocaleString()} UZS
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="flex items-center bg-muted/40 rounded-xl p-1 border border-border/10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-background hover:shadow-sm"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-10 text-center font-mono font-bold text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-background hover:shadow-sm"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Checkout Footer */}
        {!isEmpty && (
          <div className="p-6 bg-card/80 backdrop-blur-md border-t border-border/40 space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm text-muted-foreground font-medium">
                <span>Subtotal</span>
                <span className="font-mono">{totalPrice.toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground font-medium">
                <span>Delivery Fee</span>
                <span className="font-mono">+{deliveryFee.toLocaleString()} UZS</span>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex justify-between items-end pt-1">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Payable</span>
                  <span className="text-2xl font-black text-primary font-mono">
                    {finalTotal.toLocaleString()} UZS
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground font-bold text-right leading-tight">
                  VAT INCLUDED<br />© 2026 ORDERUZ
                </div>
              </div>
            </div>

            <Button 
              className={cn(
                "w-full h-14 text-lg font-extrabold gap-3 rounded-2xl",
                "bg-primary text-primary-foreground shadow-xl shadow-primary/20",
                "hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
              )}
            >
              <CreditCard className="w-5 h-5" />
              Place Order
            </Button>
            
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-[0.2em]">
                Encrypted Checkout via UzCard / Humo
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
