import { proxyToGdn } from "../../functions-lib/gdn-proxy.js";

// /category/:slug -> server-rendered category page from the GDN API.
export const onRequestGet = proxyToGdn;
