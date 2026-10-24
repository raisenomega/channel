/**
 * HUB by Raisen — Contrato con CEREBRO. Fuente UNICA: @raisenomega/cerebro-contracts (Slice 0).
 * Reexporta los tipos del paquete para que HUB los consuma por una sola frontera. Los nombres son
 * los del contrato compartido y el JSON del wire va en snake_case (lo que CEREBRO parsea). C4 <=75.
 */
export type {
  IdType,
  IdentityRef,
  PersonId,
  SourcePlatform,
  EventName,
  CerebroEvent,
  IngestAck,
  RequestingAgent,
  Visibility,
  RetrieveRequest,
  RetrieveResponse,
  RetrievedChunk,
  RetrievedFact,
} from "@raisenomega/cerebro-contracts";
export { degradedResponse } from "@raisenomega/cerebro-contracts";
