import { proxyToGdn } from "../functions-lib/gdn-proxy.js";

// /robots.txt -> robots.txt from the GDN API (blocks /api/, links the sitemap).
export const onRequestGet = proxyToGdn;
