import { proxyToGdn } from "../functions-lib/gdn-proxy.js";

// /sitemap-stores.xml -> store sitemap from the GDN API.
export const onRequestGet = proxyToGdn;
