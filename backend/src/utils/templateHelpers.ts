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

  // Frontend-specific helpers
  jsType: (type: string) => {
    if (!type) return 'string';
    const jsMap: Record<string, string> = {
      string: 'string',
      integer: 'number',
      decimal: 'number',
      boolean: 'boolean',
      date: 'string',
      datetime: 'string',
      uuid: 'string',
      json: 'any',
      enum: 'string',
      image: 'string',
      file: 'string',
      document: 'string',
      text: 'string',
    };
    return jsMap[type] || 'string';
  },

  inputType: (type: string) => {
    if (!type) return 'text';
    const inputMap: Record<string, string> = {
      string: 'text',
      integer: 'number',
      decimal: 'number',
      boolean: 'checkbox',
      date: 'date',
      datetime: 'datetime-local',
      uuid: 'text',
      json: 'text',
      enum: 'select',
      image: 'file',
      file: 'file',
      document: 'file',
      text: 'text',
    };
    return inputMap[type] || 'text';
  },

  titleCase: (str: string) => {
    if (!str) return '';
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  },

  lowerCase: (str: string) => {
    if (!str) return '';
    return str.toLowerCase();
  },

  lowercase: (str: string) => {
    if (!str) return '';
    return str.toLowerCase();
  },

  hasManipulator: (elementName: string, manipulators: any[]) => {
    if (!manipulators || !Array.isArray(manipulators)) return false;
    return manipulators.some((m: any) => 
      m.schema?.linkedElement === elementName || 
      m.name.toLowerCase().includes(elementName.toLowerCase())
    );
  },

  isVisibleColumn: (name: string, type: string) => {
    // Don't show certain fields in table columns
    const hiddenFields = ['createdAt', 'updatedAt', 'id'];
    if (hiddenFields.includes(name)) return false;
    // Don't show large fields
    const hiddenTypes = ['json', 'text'];
    if (hiddenTypes.includes(type)) return false;
    return true;
  },

  getIcon: (name: string) => {
    // Simple icon mapping based on common entity names
    const iconMap: Record<string, string> = {
      user: 'Person',
      users: 'People',
      product: 'Inventory',
      products: 'Inventory',
      order: 'ShoppingCart',
      orders: 'ShoppingCart',
      task: 'CheckCircle',
      tasks: 'CheckCircle',
      category: 'Category',
      categories: 'Category',
      post: 'Article',
      posts: 'Article',
      comment: 'Comment',
      comments: 'Comment',
      message: 'Message',
      messages: 'Message',
      file: 'InsertDriveFile',
      files: 'InsertDriveFile',
      image: 'Image',
      images: 'Image',
    };
    const key = name.toLowerCase();
    return iconMap[key] || 'Inbox';
  },

  getColor: (index: number) => {
    const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
    return colors[index % colors.length];
  },
};

