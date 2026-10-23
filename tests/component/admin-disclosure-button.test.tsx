import {render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {expect,it,vi} from "vitest";
import {AdminDisclosureButton} from "@/components/admin/admin-disclosure-button";

it("opens the registration form and focuses its first field",async()=>{
 const scroll=vi.fn();Element.prototype.scrollIntoView=scroll;
 render(<><AdminDisclosureButton targetId="manual-inquiry">수동 등록</AdminDisclosureButton><details id="manual-inquiry"><summary>전화 문의</summary><label>이름<input/></label></details></>);
 expect(screen.getByLabelText("이름")).not.toBeVisible();
 await userEvent.click(screen.getByRole("button",{name:"수동 등록"}));
 expect(screen.getByLabelText("이름")).toBeVisible();
 expect(screen.getByLabelText("이름")).toHaveFocus();
 expect(scroll).toHaveBeenCalled();
});
