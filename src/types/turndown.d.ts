declare module "turndown" {
  interface TurndownOptions {
    headingStyle?: "setext" | "atx";
    hr?: string;
    br?: string;
    bulletListMarker?: string;
    codeBlockStyle?: "indented" | "fenced";
    emDelimiter?: string;
    strongDelimiter?: string;
    linkStyle?: "inlined" | "referenced";
    linkReferenceStyle?: "full" | "collapsed" | "shortcut";
    preformattedCode?: boolean;
  }

  class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(html: string): string;
    addRule(key: string, rule: { filter: string | string[] | ((node: HTMLElement, options: any) => boolean); replacement: (content: string, node: HTMLElement) => string }): this;
    keep(filter: string | string[]): this;
    remove(filter: string | string[]): this;
    use(plugin: ((service: TurndownService) => void) | ((service: TurndownService) => void)[]): this;
  }

  export default TurndownService;
}
