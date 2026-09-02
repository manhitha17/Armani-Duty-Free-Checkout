export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice: number;
  image: string;
  description: string;
  size: string;
  badge: string;
  rfidTag: string;
};

export const catalog: CatalogProduct[] = [
  {
    id: "acqua-di-gio-profondo",
    name: "Acqua di Giò Profondo",
    brand: "Giorgio Armani",
    category: "Fragrance",
    price: 128,
    compareAtPrice: 151,
    image:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=85",
    description: "A marine, mineral fragrance with a deep blue signature.",
    size: "100 ml",
    badge: "Bestseller",
    rfidTag: "ARM-1001",
  },
  {
    id: "si-eau-de-parfum",
    name: "Sì Eau de Parfum",
    brand: "Giorgio Armani",
    category: "Fragrance",
    price: 156,
    compareAtPrice: 185,
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
    description: "A modern chypre with cassis, rose and warm vanilla.",
    size: "100 ml",
    badge: "Iconic",
    rfidTag: "ARM-1002",
  },
  {
    id: "my-way-parfum",
    name: "My Way Parfum",
    brand: "Giorgio Armani",
    category: "Fragrance",
    price: 142,
    compareAtPrice: 169,
    image:
      "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85",
    description: "A bright, confident bouquet made for new horizons.",
    size: "90 ml",
    badge: "New",
    rfidTag: "ARM-1003",
  },
  {
    id: "luminous-silk",
    name: "Luminous Silk Foundation",
    brand: "Armani Beauty",
    category: "Makeup",
    price: 67,
    compareAtPrice: 79,
    image:
      "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=900&q=85",
    description: "A radiant, weightless finish inspired by silk.",
    size: "30 ml",
    badge: "Travel edit",
    rfidTag: "ARM-1004",
  },
  {
    id: "lip-maestro-set",
    name: "Lip Maestro Set",
    brand: "Armani Beauty",
    category: "Makeup",
    price: 92,
    compareAtPrice: 112,
    image:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85",
    description: "Three vivid satin shades in a ready-to-gift travel set.",
    size: "3 × 6.5 ml",
    badge: "Gift set",
    rfidTag: "ARM-1005",
  },
  {
    id: "crema-nera",
    name: "Crema Nera Supreme Recovery",
    brand: "Armani Beauty",
    category: "Skincare",
    price: 220,
    compareAtPrice: 260,
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85",
    description: "A replenishing cream with mineral-rich volcanic complex.",
    size: "50 ml",
    badge: "Luxury care",
    rfidTag: "ARM-1006",
  },
  {
    id: "stronger-with-you",
    name: "Stronger With You Intensely",
    brand: "Emporio Armani",
    category: "Fragrance",
    price: 112,
    compareAtPrice: 133,
    image:
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=900&q=85",
    description: "A warm, magnetic amber wood for unforgettable evenings.",
    size: "100 ml",
    badge: "Warm & magnetic",
    rfidTag: "ARM-1007",
  },
  {
    id: "emporio-sunglasses",
    name: "EA Signature Sunglasses",
    brand: "Emporio Armani",
    category: "Accessories",
    price: 185,
    compareAtPrice: 230,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85",
    description: "A lightweight acetate frame with the EA signature detail.",
    size: "One size",
    badge: "Airport exclusive",
    rfidTag: "ARM-1008",
  },
];

export function findProduct(productId: string) {
  return catalog.find((product) => product.id === productId);
}

export function findProductByTag(tagId: string) {
  return catalog.find(
    (product) => product.rfidTag.toLowerCase() === tagId.trim().toLowerCase(),
  );
}

export const storeStatus = {
  open: true,
  location: "Terminal 3 · International Departures",
  terminal: "T3",
  collectionPoint: "Gate lounge collection · Desk 14",
  nextFlight: "Your next flight departs in 02h 18m",
};
