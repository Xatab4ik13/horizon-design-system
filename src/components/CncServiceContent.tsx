import { CNC_SERVICE, workshopMapUrl } from "../data/cnc-service";

// Used both in the live page and the generated HTML, without separate crawler copy.
export default function CncServiceContent() {
  return (
    <>
      <header className="max-w-3xl mb-12">
        <p className="text-primary text-sm mb-3">FAKTURA · Московская область</p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">{CNC_SERVICE.title}</h1>
        <p className="text-lg text-muted-foreground">{CNC_SERVICE.intro}</p>
      </header>
      <section aria-labelledby="cnc-field" className="grid md:grid-cols-2 gap-8 md:gap-16 mb-14">
        <div>
          <h2 id="cnc-field" className="text-2xl font-bold mb-5">Рабочее поле 3 × 2 м</h2>
          <dl className="mb-5">
            <div className="flex justify-between gap-4 py-3 border-b border-border"><dt className="text-muted-foreground">Длина поля</dt><dd>3000 мм</dd></div>
            <div className="flex justify-between gap-4 py-3 border-b border-border"><dt className="text-muted-foreground">Ширина поля</dt><dd>2000 мм</dd></div>
          </dl>
          <p className="text-muted-foreground">{CNC_SERVICE.fieldNote}</p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-5">Какие материалы фрезеруем</h2>
          <ul className="space-y-3 mb-5">{CNC_SERVICE.materials.map(material => <li className="border-b border-border py-3" key={material}>{material}</li>)}</ul>
          <p className="text-muted-foreground">{CNC_SERVICE.materialsNote}</p>
        </div>
      </section>
      <section className="grid md:grid-cols-2 gap-8 md:gap-16 mb-14">
        <div><h2 className="text-2xl font-bold mb-5">Что нужно для расчёта</h2><p className="text-muted-foreground">{CNC_SERVICE.estimate}</p></div>
        <div><h2 className="text-2xl font-bold mb-5">Сколько стоит фрезеровка</h2><p className="text-muted-foreground">{CNC_SERVICE.price}</p></div>
      </section>
      <section className="max-w-3xl mb-8">
        <h2 className="text-2xl font-bold mb-5">Адрес мастерской в Клину</h2>
        <address className="not-italic mb-4">{CNC_SERVICE.address}</address>
        <a href={workshopMapUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Найти адрес на Яндекс Картах</a>
      </section>
    </>
  );
}