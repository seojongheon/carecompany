import { describe, expect, it } from "vitest";
import { adminMenuForRole, currentAdminItem } from "@/lib/admin/navigation";
describe("admin navigation authorization", () => {
 it("shows all nine menus to master but omits privileged menus for operators", () => {
  expect(adminMenuForRole("super_admin")).toHaveLength(9);
  expect(adminMenuForRole("admin").map(x=>x.href)).not.toContain("/admin/users");
  expect(adminMenuForRole("admin").map(x=>x.href)).not.toContain("/admin/settings");
  expect(adminMenuForRole("customer")).toEqual([]);
 });
 it("selects the specific parent instead of dashboard",()=>{
  expect(currentAdminItem("/admin/portfolio/123/edit")?.href).toBe("/admin/portfolio");
 });
});
