/**
 * Template helper functions for Handlebars
 */

export const templateHelpers = {
  // String case transformations
  pascalCase: (str: string) => {
    if (!str) return '';
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^(.)/, (chr) => chr.toUpperCase());
  },

  camelCase: (str: string) => {
    if (!str) return '';
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^(.)/, (chr) => chr.toLowerCase());
  },

  kebabCase: (str: string) => {
    if (!str) return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },

  snakeCase: (str: string) => {
    if (!str) return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  },

  pluralize: (str: string) => {
    if (!str) return '';
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies';
    }
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z')) {
      return str + 'es';
    }
    return str + 's';
  },

  // Type mappings
  mapType: (type: string) => {
    if (!type) return 'String';
    const typeMap: Record<string, string> = {
      string: 'String',
      integer: 'Int',
      decimal: 'Decimal',
      boolean: 'Boolean',
      date: 'DateTime',
      datetime: 'DateTime',
      uuid: 'String',
      json: 'Json',
      enum: 'String',
      image: 'String',    // URL to image
      file: 'String',     // URL to file
      document: 'String', // URL to document
    };
    return typeMap[type] || 'String';
  },

  zodType: (type: string) => {
    if (!type) return 'z.string()';
    const zodMap: Record<string, string> = {
      string: 'z.string()',
      integer: 'z.number().int()',
      decimal: 'z.number()',
      boolean: 'z.boolean()',
      date: 'z.date()',
      datetime: 'z.date()',
      uuid: 'z.string().uuid()',
      json: 'z.any()',
      enum: 'z.enum([])',
      image: 'z.string().url()',    // URL validation
      file: 'z.string().url()',     // URL validation
      document: 'z.string().url()', // URL validation
    };
    return zodMap[type] || 'z.string()';
  },

  // Comparison helpers
  eq: (a: any, b: any) => a === b,
  ne: (a: any, b: any) => a !== b,
  lt: (a: any, b: any) => a < b,
  gt: (a: any, b: any) => a > b,

  // Array helpers
  join: (arr: any[], separator: string = ', ') => {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.join(separator);
  },

  // Conditional helpers
  and: (...args: any[]) => {
    return args.slice(0, -1).every(Boolean);
  },

  or: (...args: any[]) => {
    return args.slice(0, -1).some(Boolean);
  },

  includes: (arr: any[], value: any) => {
    if (!arr || !Array.isArray(arr)) return false;
    return arr.includes(value);
  },

  // Math helpers
  multiply: (a: number, b: number) => a * b,
  divide: (a: number, b: number) => b !== 0 ? a / b : 0,
  add: (a: number, b: number) => a + b,
  subtract: (a: number, b: number) => a - b,
};

