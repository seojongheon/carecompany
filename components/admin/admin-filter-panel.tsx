"use client";
import { useId, useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminFilterPanel({search,children,activeCount=0}:{search:ReactNode;children:ReactNode;activeCount?:number}) {
 const [open,setOpen]=useState(false);const id=useId();
 return <div className="admin-filter-panel"><div className="flex min-w-0 items-end gap-3"><div className="min-w-0 flex-1">{search}</div><Button type="button" variant="secondary" className="lg:hidden" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><SlidersHorizontal size={16} aria-hidden="true"/>필터{activeCount>0?` ${activeCount}`:""}</Button></div><div id={id} data-expanded={open} className="admin-filter-fields">{children}</div></div>;
}
