export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalPurchases: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  customerId?: string;
  cashierId: string;
  date: string;
  receiptNumber: string;
}

export const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: '🏷️' },
  { id: 'medical', name: 'مستلزمات طبية', icon: '💊' },
  { id: 'cosmetics', name: 'مستحضرات تجميل', icon: '💄' },
  { id: 'personal', name: 'عناية شخصية', icon: '🧴' },
  { id: 'devices', name: 'أجهزة طبية', icon: '🩺' },
  { id: 'supplements', name: 'مكملات غذائية', icon: '💪' },
  { id: 'baby', name: 'مستلزمات أطفال', icon: '👶' },
];

export const DEMO_PRODUCTS: Product[] = [
  { id: '1', name: 'كمامات طبية (50 قطعة)', price: 25.00, category: 'medical', image: '💊', stock: 150 },
  { id: '2', name: 'جهاز قياس ضغط الدم', price: 185.00, category: 'devices', image: '🩺', stock: 30 },
  { id: '3', name: 'كريم واقي شمس SPF50', price: 75.00, category: 'cosmetics', image: '🧴', stock: 80 },
  { id: '4', name: 'فيتامين C 1000mg', price: 45.00, category: 'supplements', image: '💊', stock: 200 },
  { id: '5', name: 'حليب أطفال رقم 1', price: 95.00, category: 'baby', image: '🍼', stock: 60 },
  { id: '6', name: 'معقم يدين 500ml', price: 18.00, category: 'personal', image: '🧴', stock: 300 },
  { id: '7', name: 'شاش طبي معقم', price: 12.00, category: 'medical', image: '🩹', stock: 500 },
  { id: '8', name: 'جهاز قياس السكر', price: 120.00, category: 'devices', image: '🔬', stock: 25 },
  { id: '9', name: 'كريم مرطب للبشرة', price: 55.00, category: 'cosmetics', image: '💄', stock: 90 },
  { id: '10', name: 'أوميغا 3', price: 65.00, category: 'supplements', image: '💊', stock: 110 },
  { id: '11', name: 'حفاضات أطفال (40 قطعة)', price: 85.00, category: 'baby', image: '👶', stock: 150 },
  { id: '12', name: 'ميزان حرارة رقمي', price: 35.00, category: 'devices', image: '🌡️', stock: 70 },
  { id: '13', name: 'غسول وجه طبي', price: 42.00, category: 'personal', image: '🧴', stock: 120 },
  { id: '14', name: 'قفازات طبية (100 قطعة)', price: 30.00, category: 'medical', image: '🧤', stock: 200 },
  { id: '15', name: 'فيتامين D3', price: 38.00, category: 'supplements', image: '💊', stock: 180 },
  { id: '16', name: 'كريم حماية للأطفال', price: 28.00, category: 'baby', image: '👶', stock: 95 },
];

export const DEMO_CUSTOMERS: Customer[] = [
  { id: '1', name: 'محمد أحمد', phone: '0501234567', email: 'mohammed@email.com', loyaltyPoints: 350, totalPurchases: 2500 },
  { id: '2', name: 'فاطمة علي', phone: '0559876543', loyaltyPoints: 120, totalPurchases: 800 },
  { id: '3', name: 'خالد سعد', phone: '0541112233', email: 'khaled@email.com', loyaltyPoints: 500, totalPurchases: 4200 },
  { id: '4', name: 'نورة عبدالله', phone: '0567778899', loyaltyPoints: 80, totalPurchases: 650 },
];
