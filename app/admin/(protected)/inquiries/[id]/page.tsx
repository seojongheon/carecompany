import {notFound} from "next/navigation";
import {z} from "zod";
import {inquiryDetail} from "@/features/inquiries/server/queries";
import {InquiryWorkspace} from "@/features/inquiries/ui/inquiry-workspace";
export default async function InquiryDetailPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const detail=await inquiryDetail(id);if(!detail)notFound();return <InquiryWorkspace key={detail.inquiry.id} {...detail}/>;}
