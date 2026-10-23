import {render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {expect,it} from "vitest";
import {AdminFilterPanel} from "@/components/admin/admin-filter-panel";

it("keeps filter values when mobile filters are closed and reopened",async()=>{
 render(<AdminFilterPanel activeCount={2} search={<label>검색<input/></label>}><label>서비스<input defaultValue="화장실"/></label></AdminFilterPanel>);
 const user=userEvent.setup();
 const button=screen.getByRole("button",{name:"필터 2"});
 expect(button).toHaveAttribute("aria-expanded","false");
 await user.click(button);
 expect(button).toHaveAttribute("aria-expanded","true");
 await user.type(screen.getByLabelText("서비스")," 청소");
 await user.click(button);await user.click(button);
 expect(screen.getByLabelText("서비스")).toHaveValue("화장실 청소");
});
