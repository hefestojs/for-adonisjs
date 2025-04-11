# Model Conventions

## Overview
Models in HefestoJS extend the base AdonisJS Lucid model with additional features for schema management, querying, and pagination.

## Base Model
All models should extend the `HBaseModel` class:
```typescript
import HBaseModel from '@hefestojs/for-adonisjs/model'

export default class YourModel extends HBaseModel {
  // Your model implementation
}
```

## Schema Definition
Models support JSON Schema generation with the following structure:
```typescript
static schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  name: string,      // Model name
  title: string,     // Human-readable title
  type: 'object',
  properties: {},    // Column definitions
  relationships: {}  // Relationship definitions
}
```

## Query Methods
### Standard Queries
```typescript
// Basic query with relationships
const result = await Model.queryWith(['relation1', 'relation2'])

// Query with conditions
const result = await Model.findOrFailWith({
  where: { column: value },
  join: ['relation1'],
  scopes: { scope1: params }
})
```

### Pagination
```typescript
const result = await Model.pagination({
  where: {},    // Where conditions
  join: {},     // Relations to include
  order: {},    // Sorting options
  page: 1,      // Page number
  limit: 100,   // Items per page
  baseUrl: '',  // Base URL for pagination links
  scopes: {}    // Query scopes to apply
})
```

## Property Conventions
- Use snake_case for database columns
- Define relationships using AdonisJS conventions
- Include proper type definitions
- Document column constraints and validations

## Relationship Conventions
- Define relationships using proper method names
- Include inverse relationships where appropriate
- Document relationship types and constraints
- Use eager loading when appropriate

## Query Parameter Conventions
Query parameters should follow these formats:
- Simple where: `where[column]=value`
- Operators: `where[column][operator]=value`
- Relations: `join[]=relation1,relation2`
- Ordering: `order[column]=asc|desc`