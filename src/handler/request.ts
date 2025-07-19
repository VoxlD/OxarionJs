import { ParsedFormData } from "../form_data";

export class OxarionRequest<TParams extends Record<string, any>> {
  constructor(public readonly raw: Request, private readonly params: TParams) {}

  /**
   * Returns the value of a route parameter by key.
   * @param key - The parameter name.
   */
  getParam<K extends keyof TParams>(key: K): TParams[K] {
    return this.params[key];
  }

  /**
   * Returns the full request URL as a string.
   */
  url(): string {
    return this.raw.url;
  }

  /**
   * Parses the request body as JSON.
   */
  async json<T = unknown>(): Promise<T> {
    return await this.raw.json();
  }

  /**
   * Reads the request body as plain text.
   */
  async text(): Promise<string> {
    return await this.raw.text();
  }

  /**
   * Parses the request body as form data.
   */
  async form(): Promise<ParsedFormData> {
    const data = await this.raw.formData();
    return new ParsedFormData(data);
  }

  /**
   * Returns the HTTP method of the request.
   */
  method() {
    return this.raw.method;
  }

  /**
   * Returns all request headers as a lowercase key-value object.
   */
  getHeaders(): Record<string, string> {
    const result: Record<string, string> = {};
    const entries = Array.from(this.raw.headers.entries());
    let i = 0;

    while (i < entries.length) {
      const [key, value] = entries[i];
      result[key.toLowerCase()] = value;
      i++;
    }

    return result;
  }

  /**
   * Returns the value of a query parameter by name.
   * @param name - The query parameter name.
   */
  getQuery(name: string): string | undefined {
    return this.getQueries()[name];
  }

  /**
   * Returns all query parameters as a key-value object.
   */
  getQueries<T extends Record<string, string> = Record<string, string>>(): T {
    const url = this.raw.url;
    const qmark = url.indexOf("?");
    if (qmark === -1 || qmark === url.length - 1) return {} as T;

    const qstr = url.slice(qmark + 1);
    const result: Record<string, string> = {};

    let i = 0;
    while (i < qstr.length) {
      let amp = qstr.indexOf("&", i);
      if (amp === -1) amp = qstr.length;

      const pair = qstr.slice(i, amp);
      const eq = pair.indexOf("=");

      if (eq !== -1) {
        const key = decodeURIComponent(pair.slice(0, eq));
        const val = decodeURIComponent(pair.slice(eq + 1));
        result[key] = val;
      }

      i = amp + 1;
    }

    return result as T;
  }
}
