import { proxyToGdn } from "../../functions-lib/gdn-proxy.js";

// /product/:slug -> server-rendered product landing page from the GDN API.
export const onRequestGet = proxyToGdn;
