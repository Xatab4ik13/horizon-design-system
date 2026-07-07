import { useEffect, useRef, useState } from "react";
import { suggestAddress, type AddressSuggestion } from "@/lib/dadata";
import { cn } from "@/lib/utils";

type Mode = "city" | "address";

type Props = {
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestion) => void;
  mode?: Mode;
  /** Ограничить подсказки по городу (для mode="address"). */
  cityFilter?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  autoComplete?: string;
};

/**
 * Инпут с автоподсказками адреса от DaData.
 * mode="city" — подсказывает только города/населённые пункты.
 * mode="address" — полный адрес (можно ограничить городом через cityFilter).
 */
export default function DadataAddressInput({
  value,
  onChange,
  mode = "address",
  cityFilter,
  placeholder,
  disabled,
  className,
  inputClassName,
  id,
  autoComplete = "off",
}: Props) {
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const lastPickedRef = useRef<string>("");

  useEffect(() => {
    if (!open) return;
    const q = value?.trim() ?? "";
    if (q.length < 2 || q === lastPickedRef.current) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const locations =
        mode === "address" && cityFilter?.trim()
          ? [{ city: cityFilter.trim() }]
          : undefined;
      const suggestions = await suggestAddress({
        query: q,
        fromBound: mode === "city" ? "city" : undefined,
        toBound: mode === "city" ? "settlement" : undefined,
        locations,
        signal: ctrl.signal,
      });
      setItems(suggestions);
      setActive(-1);
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [value, mode, cityFilter, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (s: AddressSuggestion) => {
    const v =
      mode === "city"
        ? s.data.city_with_type || s.data.settlement_with_type || s.value
        : s.value;
    lastPickedRef.current = v;
    onChange(v, s);
    setOpen(false);
    setItems([]);
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <input
        id={id}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => {
          lastPickedRef.current = "";
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(items.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(items[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={cn(
          "w-full px-4 py-3 rounded-xl bg-background/60 border border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors",
          inputClassName,
        )}
      />
      {open && items.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-popover shadow-lg text-sm">
          {items.map((s, i) => (
            <li
              key={`${s.value}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              className={cn(
                "px-3 py-2 cursor-pointer text-foreground/90 hover:bg-primary/10",
                i === active && "bg-primary/10",
              )}
            >
              {s.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
