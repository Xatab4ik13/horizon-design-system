import productPano1 from "@/assets/product-pano-1.jpeg";
import productPano2 from "@/assets/product-pano-2.jpg";
import productPano3 from "@/assets/product-pano-3.jpg";
import productMirror1 from "@/assets/product-mirror-1.jpeg";
import productShelf2 from "@/assets/product-shelf-2.jpg";
import productShelf3 from "@/assets/product-shelf-3.jpg";

// --- Reviews & Q&A ---
export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
}

export interface QA {
  id: string;
  question: string;
  questionAuthor: string;
  questionDate: string;
  answer: string;
  answerDate: string;
}

// --- Variations ---
export interface Variation {
  type: "size" | "coating" | "wood";
  label: string;
  options: { value: string; label: string; priceModifier?: number }[];
}

// --- Product ---
export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  subcategory: string;
  material: string;
  coating: string;
  description: string;
  details: string;
  dimensions: string;
  weight: string;
  images: string[];
  inStock: boolean;
  isNew?: boolean;
  arModel?: { glb: string; usdz: string };
  variations?: Variation[];
  reviews: Review[];
  qa: QA[];
  rating: number;
  relatedIds?: string[];
  crossSellIds?: string[];
}

// Mock reviews
const mockReviews: Record<string, Review[]> = {
  "pano-wave": [
    { id: "r1", author: "Анна М.", rating: 5, date: "2025-12-15", text: "Потрясающая работа! Панно стало центром нашей гостиной. Качество древесины и резьбы на высшем уровне.", verified: true },
    { id: "r2", author: "Дмитрий К.", rating: 5, date: "2025-11-28", text: "Заказывал в подарок жене. Упаковка идеальная, доставили быстро. Рисунок объёмный, фактурный — в жизни ещё красивее, чем на фото.", verified: true },
    { id: "r3", author: "Елена С.", rating: 4, date: "2025-10-10", text: "Красивое панно, но доставка заняла чуть дольше, чем обещали. Само изделие без нареканий.", verified: false },
  ],
  "pano-zebra": [
    { id: "r4", author: "Игорь Л.", rating: 5, date: "2025-12-01", text: "Четыре панели идеально стыкуются. Эффект волн потрясающий, особенно при боковом освещении.", verified: true },
    { id: "r12", author: "Светлана Б.", rating: 5, date: "2026-01-08", text: "Заказали из ясеня — цвет и текстура великолепные. Монтаж простой, крепления в комплекте.", verified: true },
    { id: "r13", author: "Андрей Н.", rating: 4, date: "2025-11-20", text: "Отличная композиция, но хотелось бы вариант из 6 панелей для большой стены.", verified: false },
  ],
  "pano-radiance": [
    { id: "r5", author: "Ресторан «Дубрава»", rating: 5, date: "2026-01-20", text: "Установили в зал ресторана — гости в восторге. Монументальная работа, стоит каждого рубля.", verified: true },
    { id: "r6", author: "Марина В.", rating: 5, date: "2025-12-05", text: "Заказывали индивидуальный размер 200×200. Мастера сделали идеально под наш проект.", verified: true },
    { id: "r14", author: "Кирилл Р.", rating: 5, date: "2026-02-10", text: "Панно «Сияние» — настоящее произведение искусства. Девять модулей создают потрясающий эффект.", verified: true },
  ],
  "mirror-wave": [
    { id: "r7", author: "Ольга П.", rating: 5, date: "2026-01-10", text: "Зеркало изумительное! Рама вырезана с невероятной точностью. Рекомендую всем.", verified: true },
    { id: "r8", author: "Сергей Д.", rating: 4, date: "2025-11-15", text: "Отличное качество, но хотелось бы больше вариантов размеров.", verified: false },
    { id: "r9", author: "Татьяна Р.", rating: 5, date: "2026-02-01", text: "Заказали в прихожую — смотрится роскошно. Рама идеально обработана, дерево приятное на ощупь. Упаковка надёжная.", verified: true },
    { id: "r10", author: "Михаил Г.", rating: 5, date: "2026-01-25", text: "Покупал жене на день рождения. Она в восторге! Зеркало большое, качественное, ручная работа видна сразу.", verified: true },
    { id: "r11", author: "Ирина К.", rating: 4, date: "2025-12-20", text: "Красивое зеркало, но доставка заняла 10 дней вместо обещанных 7. Само изделие — 5 из 5.", verified: true },
  ],
  "shelf-console": [
    { id: "r15", author: "Виктория М.", rating: 5, date: "2026-01-18", text: "Полка-консоль отлично вписалась в прихожую. Три секции очень удобны для ключей, телефона и мелочей.", verified: true },
    { id: "r16", author: "Олег Т.", rating: 5, date: "2025-12-28", text: "Качество дуба на высоте, масло с воском приятное на ощупь. Скрытые крепления — большой плюс.", verified: true },
    { id: "r17", author: "Наталья Ф.", rating: 4, date: "2026-02-05", text: "Красивая полка, немного тяжеловата, но зато надёжная. Выдерживает вес без проблем.", verified: false },
  ],
  "shelf-wave": [
    { id: "r18", author: "Алексей В.", rating: 5, date: "2026-02-12", text: "Потрясающая форма! Полки «Волна» создают ощущение движения на стене. Ясень смотрится благородно.", verified: true },
    { id: "r19", author: "Екатерина С.", rating: 5, date: "2026-01-30", text: "Заказали комплект из двух полок — они идеально дополняют друг друга. Лак качественный, не липнет.", verified: true },
    { id: "r20", author: "Павел Д.", rating: 4, date: "2025-12-15", text: "Изогнутая форма очень необычная. Единственное — хотелось бы больше цветовых вариантов.", verified: true },
  ],
};

const mockQA: Record<string, QA[]> = {
  "pano-wave": [
    { id: "q1", question: "Можно ли заказать другой размер?", questionAuthor: "Виктор", questionDate: "2025-11-05", answer: "Да, мы изготавливаем панно по индивидуальным размерам. Свяжитесь с нами для расчёта стоимости.", answerDate: "2025-11-06" },
    { id: "q2", question: "Подходит ли для влажных помещений?", questionAuthor: "Наталья", questionDate: "2025-10-20", answer: "Панно покрыто натуральным маслом, которое защищает от влаги, но для ванных комнат мы рекомендуем дополнительную обработку лаком.", answerDate: "2025-10-21" },
  ],
  "pano-zebra": [
    { id: "q6", question: "Можно ли заказать из ореха?", questionAuthor: "Денис", questionDate: "2025-12-10", answer: "Да, орех доступен за дополнительную плату. Выберите породу дерева при заказе.", answerDate: "2025-12-11" },
    { id: "q7", question: "Как стыкуются панели между собой?", questionAuthor: "Анна", questionDate: "2026-01-02", answer: "Панели имеют скрытые крепления и монтируются с зазором 3–5 мм. Подробная инструкция в комплекте.", answerDate: "2026-01-03" },
  ],
  "pano-radiance": [
    { id: "q8", question: "Какой максимальный размер вы делаете?", questionAuthor: "Ресторан «Берлога»", questionDate: "2026-01-15", answer: "Максимальный стандартный размер — 200×200 см. Для больших размеров свяжитесь с нами для индивидуального расчёта.", answerDate: "2026-01-16" },
    { id: "q9", question: "Подходит ли для коммерческих помещений?", questionAuthor: "Олег", questionDate: "2025-12-20", answer: "Абсолютно! Панно «Сияние» идеально для лобби, ресторанов, отелей. Мы часто работаем с коммерческими заказчиками.", answerDate: "2025-12-21" },
  ],
  "mirror-wave": [
    { id: "q3", question: "Какой тип крепления в комплекте?", questionAuthor: "Алексей", questionDate: "2025-12-10", answer: "В комплекте скрытые французские крепления. Зеркало вешается на два анкера, которые также входят в комплект.", answerDate: "2025-12-11" },
    { id: "q4", question: "Можно ли использовать в ванной?", questionAuthor: "Марина", questionDate: "2026-01-05", answer: "Зеркала влагостойкие, но деревянную раму рекомендуем дополнительно обработать лаком для влажных помещений. Мы можем сделать это за дополнительную плату.", answerDate: "2026-01-06" },
    { id: "q5", question: "Делаете ли вы овальные зеркала?", questionAuthor: "Павел", questionDate: "2026-01-15", answer: "Да, мы можем изготовить раму любой формы по индивидуальному заказу. Стоимость рассчитывается отдельно.", answerDate: "2026-01-16" },
  ],
  "shelf-console": [
    { id: "q10", question: "Какой максимальный вес выдерживает каждая секция?", questionAuthor: "Игорь", questionDate: "2026-01-20", answer: "Каждая секция выдерживает до 10 кг при правильном монтаже на анкерные болты.", answerDate: "2026-01-21" },
    { id: "q11", question: "Можно ли заказать из берёзы?", questionAuthor: "Мария", questionDate: "2026-02-01", answer: "Да, мы можем изготовить из берёзы, ясеня или ореха. Цена зависит от породы дерева.", answerDate: "2026-02-02" },
  ],
  "shelf-wave": [
    { id: "q12", question: "Можно ли купить одну полку, а не комплект?", questionAuthor: "Светлана", questionDate: "2026-01-25", answer: "Да, каждая полка продаётся отдельно. Большая — 12 500 ₽, малая — 8 500 ₽.", answerDate: "2026-01-26" },
    { id: "q13", question: "Подходит ли для книг?", questionAuthor: "Артём", questionDate: "2026-02-08", answer: "Да, полка выдерживает до 12 кг. Для тяжёлых книг рекомендуем большой размер.", answerDate: "2026-02-09" },
  ],
};

export const products: Product[] = [
  {
    id: "pano-wave",
    sku: "DW-INT-P001",
    name: "Панно «Волна»",
    price: 45000,
    oldPrice: 55000,
    category: "interior",
    subcategory: "pano",
    material: "Дуб",
    coating: "Натуральное масло",
    description: "Декоративное резное панно из массива дуба с объёмным волнообразным рисунком. Каждый экземпляр уникален благодаря ручной работе мастера.",
    details: "Ручная резьба по дереву. Покрытие — натуральное масло. Крепления для стены в комплекте.",
    dimensions: "120 × 50 × 5 см",
    weight: "8 кг",
    images: [productPano1, productPano2, productPano3],
    inStock: true,
    isNew: true,
    arModel: { glb: "/models/pano-wave.glb", usdz: "/models/pano-wave.usdz" },
    variations: [
      {
        type: "size",
        label: "Размер",
        options: [
          { value: "s", label: "80 × 35 см", priceModifier: -10000 },
          { value: "m", label: "120 × 50 см" },
          { value: "l", label: "160 × 65 см", priceModifier: 15000 },
        ],
      },
      {
        type: "coating",
        label: "Покрытие",
        options: [
          { value: "oil", label: "Натуральное масло" },
          { value: "wax", label: "Масло с воском", priceModifier: 3000 },
          { value: "lacquer", label: "Лак матовый", priceModifier: 5000 },
        ],
      },
    ],
    reviews: mockReviews["pano-wave"] || [],
    qa: mockQA["pano-wave"] || [],
    rating: 4.7,
    relatedIds: ["pano-zebra", "pano-radiance"],
    crossSellIds: ["mirror-wave", "shelf-console"],
  },
  {
    id: "pano-zebra",
    sku: "DW-INT-P002",
    name: "Панно «Зебра»",
    price: 68000,
    category: "interior",
    subcategory: "pano",
    material: "Ясень",
    coating: "Обжиг и масло",
    description: "Модульное панно из четырёх элементов с глубокой резьбой, создающей эффект природных волн. Композиция собирается на стене.",
    details: "Комплект из 4 панелей. Ручная резьба. Обжиг и масло. Скрытое крепление.",
    dimensions: "100 × 100 × 4 см (4 панели)",
    weight: "14 кг",
    images: [productPano2, productPano1, productPano3],
    inStock: true,
    isNew: true,
    variations: [
      {
        type: "wood",
        label: "Порода дерева",
        options: [
          { value: "ash", label: "Ясень" },
          { value: "oak", label: "Дуб", priceModifier: 8000 },
          { value: "walnut", label: "Орех", priceModifier: 15000 },
        ],
      },
      {
        type: "coating",
        label: "Покрытие",
        options: [
          { value: "charred", label: "Обжиг и масло" },
          { value: "oil", label: "Натуральное масло", priceModifier: -3000 },
          { value: "wax", label: "Масло с воском" },
        ],
      },
    ],
    reviews: mockReviews["pano-zebra"] || [],
    qa: mockQA["pano-zebra"] || [],
    rating: 4.8,
    relatedIds: ["pano-wave", "pano-radiance"],
    crossSellIds: ["mirror-wave", "shelf-console"],
  },
  {
    id: "pano-radiance",
    sku: "DW-INT-P003",
    name: "Панно «Сияние»",
    price: 95000,
    category: "interior",
    subcategory: "pano",
    material: "Бук",
    coating: "Масло с воском",
    description: "Монументальное панно из 9 модулей с лучевой геометрией. Идеально для больших пространств — гостиных, лобби, ресторанов.",
    details: "9 панелей. Ручная резьба. Покрытие — масло с воском. Скрытое крепление. Возможен индивидуальный размер.",
    dimensions: "150 × 150 × 4 см (9 панелей)",
    weight: "22 кг",
    images: [productPano3, productPano2, productPano1, productShelf2],
    inStock: true,
    isNew: true,
    variations: [
      {
        type: "size",
        label: "Размер",
        options: [
          { value: "m", label: "150 × 150 см" },
          { value: "l", label: "200 × 200 см", priceModifier: 35000 },
        ],
      },
      {
        type: "wood",
        label: "Порода дерева",
        options: [
          { value: "beech", label: "Бук" },
          { value: "oak", label: "Дуб", priceModifier: 10000 },
          { value: "ash", label: "Ясень", priceModifier: -5000 },
        ],
      },
      {
        type: "coating",
        label: "Покрытие",
        options: [
          { value: "wax", label: "Масло с воском" },
          { value: "oil", label: "Натуральное масло", priceModifier: -2000 },
          { value: "lacquer", label: "Лак матовый", priceModifier: 5000 },
        ],
      },
    ],
    reviews: mockReviews["pano-radiance"] || [],
    qa: mockQA["pano-radiance"] || [],
    rating: 5.0,
    relatedIds: ["pano-wave", "pano-zebra"],
    crossSellIds: ["shelf-wave", "mirror-wave"],
  },
  {
    id: "mirror-wave",
    sku: "DW-INT-M001",
    name: "Зеркало «Поток»",
    price: 38000,
    category: "interior",
    subcategory: "mirrors",
    material: "Берёза",
    coating: "Натуральное масло",
    description: "Дизайнерское зеркало в резной деревянной раме с органическими волнообразными линиями. Два зеркальных элемента разного диаметра.",
    details: "Рама вырезана из цельного массива. Зеркала — влагостойкие. Крепление на стену в комплекте.",
    dimensions: "60 × 80 × 3 см",
    weight: "6 кг",
    images: [productMirror1, productPano1, productPano2, productPano3, productShelf2],
    inStock: true,
    isNew: true,
    arModel: { glb: "/models/pano-wave.glb", usdz: "/models/pano-wave.usdz" },
    variations: [
      {
        type: "size",
        label: "Размер",
        options: [
          { value: "s", label: "40 × 60 см", priceModifier: -8000 },
          { value: "m", label: "60 × 80 см" },
          { value: "l", label: "80 × 100 см", priceModifier: 12000 },
          { value: "xl", label: "100 × 120 см", priceModifier: 22000 },
        ],
      },
      {
        type: "wood",
        label: "Порода дерева",
        options: [
          { value: "birch", label: "Берёза" },
          { value: "oak", label: "Дуб", priceModifier: 5000 },
          { value: "walnut", label: "Орех", priceModifier: 12000 },
          { value: "ash", label: "Ясень", priceModifier: 3000 },
        ],
      },
      {
        type: "coating",
        label: "Покрытие",
        options: [
          { value: "oil", label: "Натуральное масло" },
          { value: "wax", label: "Масло с воском", priceModifier: 3000 },
          { value: "lacquer", label: "Лак матовый", priceModifier: 5000 },
          { value: "dark-stain", label: "Морилка тёмная", priceModifier: 4000 },
        ],
      },
    ],
    reviews: mockReviews["mirror-wave"] || [],
    qa: mockQA["mirror-wave"] || [],
    rating: 4.7,
    relatedIds: ["pano-wave", "pano-zebra"],
    crossSellIds: ["shelf-console", "shelf-wave"],
  },
  {
    id: "shelf-console",
    sku: "DW-FUR-S001",
    name: "Полка-консоль «Трио»",
    price: 24000,
    category: "furniture",
    subcategory: "shelves",
    material: "Дуб",
    coating: "Масло с воском",
    description: "Настенная полка-консоль с тремя секциями разной высоты. Функциональный и стильный элемент прихожей или кабинета.",
    details: "Три отделения для мелочей. Скрытое крепление. Покрытие — масло с воском. Выдерживает до 10 кг на секцию.",
    dimensions: "60 × 30 × 80 см",
    weight: "7 кг",
    images: [productShelf2, productShelf3, productPano1],
    inStock: true,
    isNew: true,
    variations: [
      {
        type: "size",
        label: "Размер",
        options: [
          { value: "s", label: "40 × 20 × 60 см", priceModifier: -6000 },
          { value: "m", label: "60 × 30 × 80 см" },
          { value: "l", label: "80 × 35 × 100 см", priceModifier: 8000 },
        ],
      },
      {
        type: "wood",
        label: "Порода дерева",
        options: [
          { value: "oak", label: "Дуб" },
          { value: "ash", label: "Ясень", priceModifier: -2000 },
          { value: "walnut", label: "Орех", priceModifier: 10000 },
          { value: "birch", label: "Берёза", priceModifier: -4000 },
        ],
      },
      {
        type: "coating",
        label: "Покрытие",
        options: [
          { value: "wax", label: "Масло с воском" },
          { value: "oil", label: "Натуральное масло", priceModifier: -1000 },
          { value: "lacquer", label: "Лак матовый", priceModifier: 3000 },
        ],
      },
    ],
    reviews: mockReviews["shelf-console"] || [],
    qa: mockQA["shelf-console"] || [],
    rating: 4.7,
    relatedIds: ["shelf-wave"],
    crossSellIds: ["pano-wave", "mirror-wave"],
  },
  {
    id: "shelf-wave",
    sku: "DW-FUR-S002",
    name: "Полка «Волна»",
    price: 19500,
    category: "furniture",
    subcategory: "shelves",
    material: "Ясень",
    coating: "Лак на водной основе",
    description: "Изогнутая настенная полка с плавными органическими формами. Комплект из двух полок разного размера.",
    details: "Гнутый массив. Покрытие — лак на водной основе. Скрытое крепление. До 12 кг на полку.",
    dimensions: "90 × 25 × 3 см / 60 × 20 × 3 см",
    weight: "5 кг",
    images: [productShelf3, productShelf2, productPano2],
    inStock: true,
    isNew: true,
    variations: [
      {
        type: "size",
        label: "Комплектация",
        options: [
          { value: "single-l", label: "Одна большая (90 см)", priceModifier: -7000 },
          { value: "single-s", label: "Одна малая (60 см)", priceModifier: -11000 },
          { value: "set", label: "Комплект из двух" },
        ],
      },
      {
        type: "wood",
        label: "Порода дерева",
        options: [
          { value: "ash", label: "Ясень" },
          { value: "oak", label: "Дуб", priceModifier: 5000 },
          { value: "birch", label: "Берёза", priceModifier: -3000 },
        ],
      },
      {
        type: "coating",
        label: "Покрытие",
        options: [
          { value: "lacquer", label: "Лак на водной основе" },
          { value: "oil", label: "Натуральное масло" },
          { value: "wax", label: "Масло с воском", priceModifier: 2000 },
        ],
      },
    ],
    reviews: mockReviews["shelf-wave"] || [],
    qa: mockQA["shelf-wave"] || [],
    rating: 4.7,
    relatedIds: ["shelf-console"],
    crossSellIds: ["pano-zebra", "pano-wave"],
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
