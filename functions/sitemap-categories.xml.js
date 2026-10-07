import { proxyToGdn } from "../functions-lib/gdn-proxy.js";

// /sitemap-categories.xml -> category sitemap from the GDN API.
export const onRequestGet = proxyToGdn;
