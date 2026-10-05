import { proxyToGdn } from "../functions-lib/gdn-proxy.js";

// /sitemap.xml -> sitemap index from the GDN API.
export const onRequestGet = proxyToGdn;
