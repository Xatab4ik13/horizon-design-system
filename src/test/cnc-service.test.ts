import { describe, expect, it } from "vitest";
import { CNC_SERVICE, cncServiceSchema } from "../data/cnc-service";

describe("confirmed CNC service facts", () => {
  it("uses the confirmed 3 by 2 metre working field", () => {
    expect(CNC_SERVICE.fieldMm).toEqual({ length: 3000, width: 2000 });
  });
  it("offers only the confirmed materials", () => {
    expect(CNC_SERVICE.materials).toEqual(["Дерево", "Фанера", "МДФ"]);
  });
  it("uses the confirmed Klin workshop address", () => {
    expect(CNC_SERVICE.address).toBe("Московская область, город Клин, Ленинградское шоссе 88 км., строение 2");
    expect(cncServiceSchema().provider.address.addressLocality).toBe("Клин");
    expect(cncServiceSchema().provider.address.streetAddress).toBe("Ленинградское шоссе 88 км., строение 2");
  });
});