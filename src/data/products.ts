import productTable1 from "@/assets/product-table-1.jpg";
import productChair1 from "@/assets/product-chair-1.jpg";
import productDecor1 from "@/assets/product-decor-1.jpg";
import productShelf1 from "@/assets/product-shelf-1.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  material: string;
  description: string;
  details: string;
  dimensions: string;
  weight: string;
  images: string[];
  inStock: boolean;
  isNew?: boolean;
}

export const products: Product[] = [
  {
    id: "table-oak-dining",
    name: "Обеденный стол «Дуб»",
    price: 89000,
    oldPrice: 105000,
    category: "furniture",
    material: "Дуб",
    description: "Массивный обеденный стол из цельного дуба с натуральной текстурой. Каждый экземпляр уникален благодаря природному рисунку древесины.",
    details: "Ручная работа мастера. Покрытие — натуральное масло с воском, подчёркивающее природную красоту дерева. Устойчивые ножки обеспечивают надёжную опору. Подходит для 6-8 человек.",
    dimensions: "200 × 100 × 76 см",
    weight: "45 кг",
    images: [productTable1],
    inStock: true,
    isNew: true,
  },
  {
    id: "chair-walnut-scandinavian",
    name: "Стул «Скандинавия»",
    price: 32000,
    category: "kitchen",
    material: "Орех",
    description: "Элегантный стул из массива ореха с изогнутой спинкой. Эргономичный дизайн обеспечивает комфорт при длительном сидении.",
    details: "Спинка выполнена из цельного куска древесины с плавными изгибами. Финишное покрытие — датское масло. Максимальная нагрузка — 120 кг.",
    dimensions: "45 × 52 × 82 см",
    weight: "5.2 кг",
    images: [productChair1],
    inStock: true,
  },
  {
    id: "decor-wave-panel",
    name: "Панно «Волна»",
    price: 28000,
    oldPrice: 35000,
    category: "interior",
    material: "Орех, дуб",
    description: "Декоративное настенное панно с органическим резным рисунком. Волнообразные линии создают эффект движения и глубины.",
    details: "Комбинация двух пород дерева создаёт контрастный рисунок. Ручная резьба. Крепление на стену входит в комплект. Покрытие — льняное масло.",
    dimensions: "60 × 60 × 3 см",
    weight: "4.8 кг",
    images: [productDecor1],
    inStock: true,
    isNew: true,
  },
  {
    id: "shelf-modular-geometric",
    name: "Полка «Геометрия»",
    price: 18500,
    category: "storage",
    material: "Бук",
    description: "Модульная настенная полка с асимметричным дизайном. Три секции разного размера для книг и декора.",
    details: "Надёжное скрытое крепление. Выдерживает до 15 кг на секцию. Покрытие — акриловый лак на водной основе. Возможно изготовление в зеркальном варианте.",
    dimensions: "80 × 60 × 20 см",
    weight: "7.5 кг",
    images: [productShelf1],
    inStock: true,
  },
];

export const categories = [
  { slug: "furniture", name: "Мебель" },
  { slug: "kitchen", name: "Кухонные принадлежности" },
  { slug: "storage", name: "Системы хранения" },
  { slug: "interior", name: "Предметы интерьера" },
  { slug: "crafts", name: "Заготовки для творчества" },
];

export const materials = ["Дуб", "Орех", "Бук", "Ясень"];

export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getProductsByCategory = (cat: string) => products.filter((p) => p.category === cat);
