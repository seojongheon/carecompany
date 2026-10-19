import {describe,expect,it} from "vitest";
import type {MockStoreEnvelope} from "@/features/portfolio/model/types";
import {SEED_SNAPSHOT} from "@/features/portfolio/data/seed";
import {selectAdminCases} from "@/features/portfolio/selectors/portfolio-selectors";
describe("admin case list categories",()=>{
 const store=structuredClone(SEED_SNAPSHOT) as MockStoreEnvelope;
 store.cases=store.cases.slice(0,3).map((item,index)=>({...item,status:(index===0?"published":index===1?"private":"deleted"),hasDraft:true}));
 it("keeps trash out of the ordinary list",()=>{expect(selectAdminCases(store,{status:"all"}).map(x=>x.status)).toEqual(expect.not.arrayContaining(["deleted"]));expect(selectAdminCases(store,{status:"deleted"})).toHaveLength(1);});
 it("shows only changed published cases in the changed-draft filter",()=>{const result=selectAdminCases(store,{status:"draft"});expect(result).toHaveLength(1);expect(result[0].status).toBe("published");});
});
