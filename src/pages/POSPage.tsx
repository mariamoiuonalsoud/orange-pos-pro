import React, { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { CATEGORIES } from '@/data/pos-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CartPanel from '@/components/CartPanel';
import POSHeader from '@/components/POSHeader';

const POSPage = () => {
  const { products, addToCart } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <POSHeader />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="البحث عن منتج..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-10 h-12 text-base"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card text-foreground border border-border hover:border-primary'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map(product => (
                  <motion.button
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    className="bg-card rounded-xl border border-border p-4 text-center hover:border-primary hover:shadow-lg transition-all group relative overflow-hidden"
                  >
                    <div className="text-4xl mb-3">{product.image}</div>
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-primary font-bold text-lg">{product.price.toFixed(2)} ج.م</p>
                    <p className={`text-xs mt-1 ${product.stock < 10 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      المخزون: {product.stock}
                    </p>
                    
                    {/* Add overlay */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <CartPanel />
      </div>
    </div>
  );
};

export default POSPage;
