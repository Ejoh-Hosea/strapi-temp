import type { Schema, Struct } from '@strapi/strapi';

export interface ProductComponentsColor extends Struct.ComponentSchema {
  collectionName: 'components_product_components_colors';
  info: {
    displayName: 'Color';
  };
  attributes: {
    value: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'product-components.color': ProductComponentsColor;
    }
  }
}
