// Нормализатор ввода телефона: гарантирует префикс +7
export const normalizePhone = (raw: string): string => {
  let v = (raw || "").replace(/[^\d+\s\-()]/g, "");
  const digits = v.replace(/\D/g, "");
  if (!v.startsWith("+")) {
    v = "+" + (digits.startsWith("7") ? digits : "7" + digits);
  } else if (!v.startsWith("+7")) {
    v = "+7" + v.replace(/^\+?\d?/, "");
  }
  return v;
};
