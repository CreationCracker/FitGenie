import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ExternalLink, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  price: string;
  store: string;
  url: string;
  image?: string;
}

const BuyItems = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string; products?: Product[] }[]>([
    { role: "assistant", text: "Hi! Tell me what fitness product you're looking for and I'll find the best deals for you." },
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    setMessages((m) => [...m, { role: "user", text: query }]);

    // Mock response with product cards
    const mockProducts: Product[] = [
      { id: "1", name: `${query} - Premium Brand`, price: "$29.99", store: "Amazon", url: "https://amazon.com" },
      { id: "2", name: `${query} - Best Value`, price: "$19.99", store: "Walmart", url: "https://walmart.com" },
      { id: "3", name: `${query} - Pro Edition`, price: "$39.99", store: "GNC", url: "https://gnc.com" },
    ];

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: `Found ${mockProducts.length} great options for "${query}":`,
        products: mockProducts,
      },
    ]);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-foreground ml-4">Buy Fitness Items</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] space-y-3`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "gradient-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {m.text}
              </div>
              {m.products && (
                <div className="space-y-2">
                  {m.products.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.store}</p>
                        <p className="text-lg font-display font-bold text-primary mt-1">{p.price}</p>
                      </div>
                      <a href={p.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1 border-primary/30 text-primary hover:bg-primary/10">
                          <ShoppingCart className="w-3.5 h-3.5" /> Buy
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      <div className="border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="e.g. Whey Protein, Resistance Bands…"
            className="bg-secondary border-border text-foreground h-12"
          />
          <Button onClick={handleSend} className="gradient-primary text-primary-foreground h-12 px-5">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuyItems;
