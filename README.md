# Shopify TCG Box Theme

A starter Shopify Online Store 2.0 theme scaffold for a trading card ecommerce storefront.

## What is included

- Standard Shopify theme directories: `assets`, `config`, `layout`, `locales`, `sections`, `snippets`, `templates`
- Base layout in `layout/theme.liquid`
- Theme settings schema in `config/settings_schema.json`
- Starter homepage template in `templates/index.json`
- Reusable sections for header, footer, hero, rich text, and featured collection
- Base styles and JavaScript

## Prerequisites

- Shopify store with Online Store sales channel
- Shopify CLI installed

Install Shopify CLI (Linux):

```bash
npm install -g @shopify/cli @shopify/theme
```

## Local development

From this repository root:

```bash
shopify auth login
shopify theme dev --store your-store.myshopify.com
```

Shopify CLI will provide a preview URL and hot-reload changes as you edit files.

## Deploy

```bash
shopify theme push --store your-store.myshopify.com
```

## Next recommended steps

- Add product, collection, cart, and account templates
- Add snippets for cards, badges, pricing, and pagination
- Wire section blocks for more flexible content editing
- Add app embed compatibility as needed