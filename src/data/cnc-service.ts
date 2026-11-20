export const CNC_SERVICE = {
  path: "/services/cnc-milling",
  title: "Фрезеровка на ЧПУ в Клину",
  seoTitle: "Фрезеровка на ЧПУ в Клину: дерево, фанера, МДФ",
  description: "Услуги фрезеровки дерева, фанеры и МДФ на ЧПУ в Клину. Рабочее поле 3000 × 2000 мм. Расчёт стоимости и сроков под вашу задачу.",
  intro: "В мастерской FAKTURA фрезеруем дерево, фанеру и МДФ на станке с ЧПУ. Работаем в Клину, на 88 км Ленинградского шоссе.",
  fieldMm: { length: 3000, width: 2000 },
  materials: ["Дерево", "Фанера", "МДФ"],
  address: "Московская область, город Клин, Ленинградское шоссе 88 км., строение 2",
  fieldNote: "Рабочее поле станка составляет 3 × 2 м. Это не означает, что можно обработать любую заготовку такого размера: нужно учитывать её толщину, крепление и саму задачу.",
  estimate: "Пришлите чертёж или эскиз, укажите материал, размеры заготовки и количество деталей. Если чертежа пока нет, опишите, что хотите получить. По этим данным обсудим возможность обработки, стоимость и срок.",
  price: "Стоимость зависит от объёма заказа и сложности обработки. Итоговую цену и срок согласуем до начала работ.",
  materialsNote: "В заявке укажите материал и толщину заготовки. Возможность обработки обсудим по вашей задаче.",
  subject: "Фрезеровка на ЧПУ",
};

export const workshopMapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(CNC_SERVICE.address)}`;

export function cncServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: CNC_SERVICE.title,
    serviceType: "Фрезеровка дерева, фанеры и МДФ на станке с ЧПУ",
    url: `https://faktura-wood.com${CNC_SERVICE.path}`,
    description: CNC_SERVICE.description,
    areaServed: { "@type": "AdministrativeArea", name: "Московская область" },
    provider: {
      "@type": "Organization", name: "FAKTURA",
      address: { "@type": "PostalAddress", addressCountry: "RU", addressRegion: "Московская область", addressLocality: "Клин", streetAddress: "Ленинградское шоссе 88 км., строение 2" },
    },
  };
}