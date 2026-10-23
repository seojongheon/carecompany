import Image from "next/image";
import type { ContentImage as ImageValue } from "../model/documents";
export function ContentImage({image,className="aspect-video"}:{image?:ImageValue & {url?:string};className?:string}){if(!image?.url)return null;return <div className={`relative overflow-hidden rounded-2xl ${className}`}><Image src={image.url} alt={image.alt} fill unoptimized className="object-cover" style={{objectPosition:`${image.focalX}% ${image.focalY}%`}}/></div>;}
