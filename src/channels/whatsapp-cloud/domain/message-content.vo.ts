/**
 * HUB by Raisen — Value Object: contenido de mensaje WhatsApp.
 * Union type: text, image, document, interactive, template.
 * C4 ≤75 lineas.
 */
export type WhatsAppContentType = "text" | "image" | "document" | "interactive" | "template" | "audio" | "video" | "sticker";

export interface TextContent {
  readonly type: "text";
  readonly body: string;
  readonly previewUrl?: boolean;
}

export interface MediaContent {
  readonly type: "image" | "document" | "audio" | "video" | "sticker";
  readonly mediaId?: string;
  readonly link?: string;
  readonly caption?: string;
  readonly filename?: string;
}

export interface InteractiveContent {
  readonly type: "interactive";
  readonly action: Record<string, unknown>;
  readonly body?: Record<string, unknown>;
  readonly footer?: Record<string, unknown>;
  readonly header?: Record<string, unknown>;
}

export interface TemplateContent {
  readonly type: "template";
  readonly name: string;
  readonly language: Record<string, string>;
  readonly components?: Record<string, unknown>[];
}

export type WhatsAppContent = TextContent | MediaContent | InteractiveContent | TemplateContent;