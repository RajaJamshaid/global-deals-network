import type { FastifyReply } from "fastify";

/**
 * Success response envelopes.
 *
 * Per docs/architecture/GDN_API_Architecture.md ("API Response
 * Structure"): { success: true, data } for a single resource, and
 * { success: true, data, meta } for a paginated list.
 */
export function sendData(
  reply: FastifyReply,
  statusCode: number,
  data: unknown,
): FastifyReply {
  return reply.status(statusCode).send({ success: true, data });
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
}

export function sendList(
  reply: FastifyReply,
  data: unknown[],
  meta: ListMeta,
): FastifyReply {
  return reply.status(200).send({ success: true, data, meta });
}
