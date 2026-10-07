import { proxyToGdn } from "../../functions-lib/gdn-proxy.js";

// /store/:slug -> server-rendered store page from the GDN API.
export const onRequestGet = proxyToGdn;
