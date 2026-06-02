import { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Quote = { ok: boolean; cost?: number; days?: string; error?: string };
type Result = { yandex?: Quote; pek?: Quote; cdek?: Quote };

const carriers: { key: keyof Result; name: string }[] = [
  { key: "cdek", name: "СДЭК" },
  { key: "pek", name: "ПЭК" },
  { key: "yandex", name: "Яндекс Доставка" },
];

const DeliveryCalculator = () => {
  const [city, setCity] = useState("");
  const [weight, setWeight] = useState("5");
  const [width, setWidth] = useState("40");
  const [height, setHeight] = useState("40");
  const [depth, setDepth] = useState("40");
  const [price, setPrice] = useState("10000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalc = async () => {
    if (!city.trim()) {
      setError("Укажите город получателя");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("delivery-quote", {
        body: {
          city: city.trim(),
          items: [
            {
              weight_kg: Number(weight) || 1,
              width_cm: Number(width) || 30,
              height_cm: Number(height) || 30,
              depth_cm: Number(depth) || 30,
              price: Number(price) || 1000,
              quantity: 1,
            },
          ],
        },
      });
      if (fnError) throw fnError;
      setResult(data as Result);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось рассчитать стоимость");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Калькулятор доставки</h3>
          <p className="text-sm text-muted-foreground">Рассчитайте стоимость доставки в ваш город</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-3">
          <Label htmlFor="calc-city" className="text-sm text-foreground/80">Город получателя</Label>
          <Input
            id="calc-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Например, Санкт-Петербург"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="calc-w" className="text-sm text-foreground/80">Ширина, см</Label>
          <Input id="calc-w" type="number" min="1" value={width} onChange={(e) => setWidth(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="calc-h" className="text-sm text-foreground/80">Высота, см</Label>
          <Input id="calc-h" type="number" min="1" value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="calc-d" className="text-sm text-foreground/80">Глубина, см</Label>
          <Input id="calc-d" type="number" min="1" value={depth} onChange={(e) => setDepth(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="calc-wt" className="text-sm text-foreground/80">Вес, кг</Label>
          <Input id="calc-wt" type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="calc-p" className="text-sm text-foreground/80">Стоимость товара, ₽</Label>
          <Input id="calc-p" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" />
        </div>
        <div className="flex items-end">
          <Button onClick={handleCalc} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Рассчитать"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}

      {result && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {carriers.map(({ key, name }) => {
            const q = result[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="text-sm text-muted-foreground mb-1">{name}</div>
                {q?.ok ? (
                  <>
                    <div className="text-foreground text-2xl font-bold">
                      {q.cost?.toLocaleString("ru-RU")} ₽
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{q.days}</div>
                  </>
                ) : (
                  <div className="text-sm text-foreground/60">
                    {q?.error ?? "Нет данных"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        Окончательная стоимость рассчитывается при оформлении заказа.
      </p>
    </div>
  );
};

export default DeliveryCalculator;
