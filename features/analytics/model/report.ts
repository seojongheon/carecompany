export interface VisitReport {startedAt:string|null;visitors:number;visits:number;pageViews:number;days:Array<{date:string;views:number;visitors:number;visits:number}>;pages:Array<{path:string;views:number}>;sources:Array<{referrer:string;views:number}>;devices:Array<{device:string;views:number}>;campaigns?:Array<{campaign:string;views:number}>;}
export function seoulDate(now=new Date()) {return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);}
export function dateDaysAgo(days:number) {return seoulDate(new Date(Date.now()-days*86400_000));}

export function collectionStartedBy(startedAt:string|null,date:string):boolean {return !!startedAt && seoulDate(new Date(startedAt))<=date;}
export function reportDates(from:string,to:string):string[] {const start=new Date(`${from}T12:00:00+09:00`).getTime();const end=new Date(`${to}T12:00:00+09:00`).getTime();if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return [];return Array.from({length:Math.min(90,Math.floor((end-start)/86400_000)+1)},(_,i)=>seoulDate(new Date(start+i*86400_000)));}
