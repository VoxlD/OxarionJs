export class ParsedFormData {
  private readonly fields: Record<string, string> = {};
  private readonly files: Record<string, File[]> = {};

  constructor(form: FormData) {
    const entries = Array.from(form.entries());
    let i = 0;

    while (i < entries.length) {
      const [key, value] = entries[i];

      if (typeof value === "string") this.fields[key] = value;
      else if ((value as unknown) instanceof File) {
        if (!this.files[key]) this.files[key] = [];
        this.files[key].push(value);
      }

      i++;
    }
  }

  /**
   * Returns the value of a form field by key.
   * @param key - The field name.
   * @returns The field value or undefined.
   */
  getField(key: string): string | undefined {
    return this.fields[key];
  }

  /**
   * Returns all form fields as a key-value object.
   * @returns An object containing all fields.
   */
  getAllFields(): Record<string, string> {
    return this.fields;
  }

  /**
   * Returns the first file for a given key.
   * @param key - The field name.
   * @returns The first File or undefined.
   */
  getFile(key: string): File | undefined {
    const f = this.files[key];
    return f?.[0];
  }

  /**
   * Returns all files for a given key.
   * @param key - The field name.
   * @returns An array of Files or undefined.
   */
  getFiles(key: string): File[] | undefined {
    return this.files[key];
  }

  /**
   * Returns all files as a key-array object.
   * @returns An object containing all files.
   */
  getAllFiles(): Record<string, File[]> {
    return this.files;
  }

  /**
   * Returns the MIME type of the first file for a given key.
   * @param key - The field name.
   * @returns The MIME type string or undefined.
   */
  getMimeType(key: string): string | undefined {
    const file = this.getFile(key);
    return file?.type;
  }

  /**
   * Returns all MIME types for each file key.
   * @returns An object mapping keys to arrays of MIME types.
   */
  getMimeTypes(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    const entries = Object.entries(this.files);
    let i = 0;

    while (i < entries.length) {
      const [key, files] = entries[i];
      result[key] = files.map((f) => f.type);
      i++;
    }

    return result;
  }
}
