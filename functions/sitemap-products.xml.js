import { proxyToGdn } from "../functions-lib/gdn-proxy.js";

// /sitemap-products.xml -> product sitemap from the GDN API.
export const onRequestGet = proxyToGdn;
