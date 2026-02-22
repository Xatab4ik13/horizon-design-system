import productPano1 from "@/assets/product-pano-1.jpeg";
import productPano2 from "@/assets/product-pano-2.jpg";
import productPano3 from "@/assets/product-pano-3.jpg";
import productMirror1 from "@/assets/product-mirror-1.jpeg";
import productShelf2 from "@/assets/product-shelf-2.jpg";
import productShelf3 from "@/assets/product-shelf-3.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  subcategory: string;
  material: string;
  description: string;
  details: string;
  dimensions: string;
  weight: string;
  images: string[];
  inStock: boolean;
  isNew?: boolean;
  arModel?: { glb: string; usdz: string };
}

export const products: Product[] = [
  {
    id: "pano-wave",
    name: "Панно «Волна»",
    price: 45000,
    oldPrice: 55000,
    category: "interior",
    subcategory: "pano",
    material: "Дуб",
    description: "Декоративное резное панно из массива дуба с объёмным волнообразным рисунком. Каждый экземпляр уникален благодаря ручной работе мастера.",
    details: "Ручная резьба по дереву. Покрытие — натуральное масло. Крепления для стены в комплекте.",
    dimensions: "120 × 50 × 5 см",
    weight: "8 кг",
    images: [productPano1],
    inStock: true,
    isNew: true,
    arModel: { glb: "/models/pano-wave.glb", usdz: "/models/pano-wave.usdz" },
  },
  {
    id: "pano-zebra",
    name: "Панно «Зебра»",
    price: 68000,
    category: "interior",
    subcategory: "pano",
    material: "Ясень",
    description: "Модульное панно из четырёх элементов с глубокой резьбой, создающей эффект природных волн. Композиция собирается на стене.",
    details: "Комплект из 4 панелей. Ручная резьба. Обжиг и масло. Скрытое крепление.",
    dimensions: "100 × 100 × 4 см (4 панели)",
    weight: "14 кг",
    images: [productPano2],
    inStock: true,
  },
  {
    id: "pano-radiance",
    name: "Панно «Сияние»",
    price: 95000,
    category: "interior",
    subcategory: "pano",
    material: "Бук",
    description: "Монументальное панно из 9 модулей с лучевой геометрией. Идеально для больших пространств — гостиных, лобби, ресторанов.",
    details: "9 панелей. Ручная резьба. Покрытие — масло с воском. Скрытое крепление. Возможен индивидуальный размер.",
    dimensions: "150 × 150 × 4 см (9 панелей)",
    weight: "22 кг",
    images: [productPano3],
    inStock: true,
    isNew: true,
  },
  {
    id: "mirror-wave",
    name: "Зеркало «Поток»",
    price: 38000,
    category: "interior",
    subcategory: "mirrors",
    material: "Берёза",
    description: "Дизайнерское зеркало в резной деревянной раме с органическими волнообразными линиями. Два зеркальных элемента разного диаметра.",
    details: "Рама вырезана из цельного массива. Зеркала — влагостойкие. Крепление на стену в комплекте.",
    dimensions: "60 × 80 × 3 см",
    weight: "6 кг",
    images: [productMirror1],
    inStock: true,
  },
  {
    id: "shelf-console",
    name: "Полка-консоль «Трио»",
    price: 24000,
    category: "furniture",
    subcategory: "shelves",
    material: "Дуб",
    description: "Настенная полка-консоль с тремя секциями разной высоты. Функциональный и стильный элемент прихожей или кабинета.",
    details: "Три отделения для мелочей. Скрытое крепление. Покрытие — масло с воском. Выдерживает до 10 кг на секцию.",
    dimensions: "60 × 30 × 80 см",
    weight: "7 кг",
    images: [productShelf2],
    inStock: true,
  },
  {
    id: "shelf-wave",
    name: "Полка «Волна»",
    price: 19500,
    category: "furniture",
    subcategory: "shelves",
    material: "Ясень",
    description: "Изогнутая настенная полка с плавными органическими формами. Комплект из двух полок разного размера.",
    details: "Гнутый массив. Покрытие — лак на водной основе. Скрытое крепление. До 12 кг на полку.",
    dimensions: "90 × 25 × 3 см / 60 × 20 × 3 см",
    weight: "5 кг",
    images: [productShelf3],
    inStock: true,
    isNew: true,
  },
];

export interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
  subcategories: Subcategory[];
}

export const categories: Category[] = [
  {
    slug: "furniture",
    name: "Мебель",
    subcategories: [
      { slug: "tables", name: "Столы" },
      { slug: "beds", name: "Кровати" },
      { slug: "nightstands", name: "Тумбы" },
      { slug: "racks", name: "Стеллажи" },
      { slug: "shelves", name: "Полки" },
    ],
  },
  {
    slug: "kitchen",
    name: "Кухонные принадлежности",
    subcategories: [
      { slug: "cutting-boards", name: "Разделочные доски" },
      { slug: "serving-boards", name: "Сервировочные доски" },
      { slug: "dishes", name: "Посуда" },
      { slug: "compartment-dishes", name: "Менажницы" },
      { slug: "salad-bowls", name: "Салатницы" },
      { slug: "trays", name: "Подносы" },
    ],
  },
  {
    slug: "storage",
    name: "Системы хранения",
    subcategories: [
      { slug: "hangers", name: "Вешалки" },
    ],
  },
  {
    slug: "interior",
    name: "Предметы интерьера",
    subcategories: [
      { slug: "pano", name: "Панно" },
      { slug: "mirrors", name: "Зеркала" },
    ],
  },
  {
    slug: "crafts",
    name: "Заготовки для творчества",
    subcategories: [
      { slug: "decoupage-bases", name: "Основы для декупажа и росписи" },
      { slug: "figures", name: "Фигурки, буквы, элементы для хендмейда" },
    ],
  },
  {
    slug: "doors",
    name: "Двери",
    subcategories: [
      { slug: "interior-doors", name: "Межкомнатные" },
      { slug: "entrance-doors", name: "Входные" },
    ],
  },
];

export const materials = ["Дуб", "Орех", "Бук", "Ясень", "Берёза"];

import woodOak from "@/assets/wood-oak.jpg";
import woodWalnut from "@/assets/wood-walnut.jpg";
import woodBeech from "@/assets/wood-beech.jpg";
import woodAsh from "@/assets/wood-ash.jpg";
import woodBirch from "@/assets/wood-birch.jpg";
import woodPine from "@/assets/wood-pine.jpg";
import woodLarch from "@/assets/wood-larch.jpg";
import woodElm from "@/assets/wood-elm.jpg";

export const woodTypes = [
  { name: "Дуб", image: woodOak },
  { name: "Орех", image: woodWalnut },
  { name: "Бук", image: woodBeech },
  { name: "Ясень", image: woodAsh },
  { name: "Берёза", image: woodBirch },
  { name: "Сосна", image: woodPine },
  { name: "Лиственница", image: woodLarch },
  { name: "Карагач", image: woodElm },
];

import coatNaturalOil from "@/assets/coat-natural-oil.jpg";
import coatOilWax from "@/assets/coat-oil-wax.jpg";
import coatMatteLacquer from "@/assets/coat-matte-lacquer.jpg";
import coatGlossyLacquer from "@/assets/coat-glossy-lacquer.jpg";
import coatDarkStain from "@/assets/coat-dark-stain.jpg";
import coatLightStain from "@/assets/coat-light-stain.jpg";
import coatCharred from "@/assets/coat-charred.jpg";
import coatWhiteEnamel from "@/assets/coat-white-enamel.jpg";
import coatBlackEnamel from "@/assets/coat-black-enamel.jpg";
import coatUnfinished from "@/assets/coat-unfinished.jpg";

export const coatings = [
  { name: "Натуральное масло", image: coatNaturalOil },
  { name: "Масло с воском", image: coatOilWax },
  { name: "Лак матовый", image: coatMatteLacquer },
  { name: "Лак глянцевый", image: coatGlossyLacquer },
  { name: "Морилка тёмная", image: coatDarkStain },
  { name: "Морилка светлая", image: coatLightStain },
  { name: "Обжиг", image: coatCharred },
  { name: "Белая эмаль", image: coatWhiteEnamel },
  { name: "Чёрная эмаль", image: coatBlackEnamel },
  { name: "Без покрытия", image: coatUnfinished },
];

export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getProductsByCategory = (cat: string) => products.filter((p) => p.category === cat);
export const getProductsBySubcategory = (sub: string) => products.filter((p) => p.subcategory === sub);
