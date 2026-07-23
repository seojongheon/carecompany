import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Supabase public environment is missing");

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const [services, cases, prices, content, profiles] = await Promise.all([
  client.from("services").select("key,active").order("sort_order"),
  client.from("portfolio_cases").select("id,status"),
  client.from("price_items").select("service_key,visible").order("sort_order"),
  client.rpc("get_published_site_content"),
  client.from("profiles").select("id,role"),
]);

if (services.error || services.data?.length !== 4 || services.data.some((item) => !item.active)) throw new Error("canonical public services verification failed");
if (cases.error || cases.data?.some((item) => item.status !== "published")) throw new Error("anonymous case policy verification failed");
if (prices.error || prices.data?.length !== 4 || prices.data.some((item) => !item.visible)) throw new Error("visible price policy verification failed");
if (content.error || !content.data?.home?.title || "draft" in content.data) throw new Error("published site content verification failed");
if (!profiles.error) throw new Error("anonymous profile access was not denied");

console.log(JSON.stringify({ services: services.data.length, publicCases: cases.data.length, visiblePrices: prices.data.length, draftExposed: false, profilesDenied: true }));
