/**
 * Type declarations for fast-xml-parser
 * The package should have built-in types, but this provides a fallback
 */

declare module 'fast-xml-parser' {
  export interface XMLParserOptions {
    ignoreAttributes?: boolean;
    attributeNamePrefix?: string;
    textNodeName?: string;
    ignoreNameSpace?: boolean;
    parseAttributeValue?: boolean;
    trimValues?: boolean;
  }

  export class XMLParser {
    constructor(options?: XMLParserOptions);
    parse(xmlData: string): unknown;
  }

  export class XMLBuilder {
    constructor(options?: unknown);
    build(jsonObj: unknown): string;
  }
}

