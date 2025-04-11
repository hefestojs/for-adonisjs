# Database Conventions

## Overview
HefestoJS provides conventions for database structure and usage to ensure consistency and proper integration with the framework's features.

## Schema Conventions
### Table Naming
- Use snake_case for table names
- Prefix tables with schema name when using schemas
- Use plural form for table names
```bash
schema_name.table_name
public.users
public.auth_tokens
```

### Column Naming
- Use snake_case for column names
- Use appropriate data types
- Include proper constraints
```sql
CREATE TABLE schema_name.table_name (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  -- other columns...
)
```

## Primary Keys
- Use `id` as the primary key name
- Use SERIAL or BIGSERIAL for auto-incrementing keys
- Include primary key constraints

## Foreign Keys
- Name format: `{table_name}_id`
- Include foreign key constraints
- Define appropriate ON DELETE and ON UPDATE actions

## Timestamps
Standard timestamp columns:
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp (nullable)

## Indexes
- Create indexes for frequently queried columns
- Index foreign key columns
- Use appropriate index types (B-tree, Hash, etc.)
- Name format: `idx_{table_name}_{column_name(s)}`

## Constraints
### Naming Conventions
- Unique constraints: `unq_{table_name}_{column_name(s)}`
- Foreign keys: `fk_{table_name}_{referenced_table}`
- Check constraints: `chk_{table_name}_{constraint_name}`

### Common Constraints
```sql
-- Unique constraint
CONSTRAINT unq_users_email UNIQUE (email)

-- Foreign key
CONSTRAINT fk_posts_user FOREIGN KEY (user_id) 
  REFERENCES users(id) ON DELETE CASCADE

-- Check constraint
CONSTRAINT chk_products_price CHECK (price >= 0)
```

## Query Conventions
### Filtering
Support for various operators in queries:
- Equality: `column = value`
- Comparison: `column [>, <, >=, <=] value`
- IN clause: `column IN (values)`
- LIKE: `column LIKE pattern`
- NULL check: `column IS [NOT] NULL`

### Sorting
- Support both ascending and descending order
- Multiple column sorting
- NULL sorting preferences

## Error Handling
Common database error codes and their meanings:
- 23505: Unique constraint violation
- 23503: Foreign key violation
- 23502: Not null violation

## Special Column Comments
HefestoJS uses special column comments to document and control relationships between tables, especially when dealing with cross-schema relationships and polymorphic associations.

### Foreign Key Comments
When a foreign key references a table in a different schema, use the following comment format:
```sql
COMMENT ON COLUMN schema_name.table_name.column_id IS 'fk:target_schema.target_table';

-- Example:
COMMENT ON COLUMN public.orders.customer_id IS 'fk:customer_schema.customers';
```

### Polymorphic Relationship Comments
For polymorphic relationships, use the following comment format:
```sql
COMMENT ON COLUMN schema_name.table_name.column_id IS 'fk:--polymorph';

-- Example:
COMMENT ON COLUMN public.attachments.attachable_id IS 'fk:--polymorph';
```

### Comment Convention Usage
These special comments are used by the model generator (`forge:model`) to:
1. Establish correct relationships between models
2. Handle cross-schema relationships properly
3. Ignore polymorphic columns when generating standard relationships
4. Generate appropriate import statements for related models

### Examples

1. Cross-schema relationship:
```sql
-- Table in public schema
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    -- This indicates the customer table is in a different schema
    COMMENT ON COLUMN public.orders.customer_id IS 'fk:customer_schema.customers'
);
```

2. Polymorphic relationship:
```sql
-- Polymorphic attachments table
CREATE TABLE public.attachments (
    id SERIAL PRIMARY KEY,
    attachable_id INTEGER,
    attachable_type VARCHAR(255),
    -- This indicates a polymorphic relationship
    COMMENT ON COLUMN public.attachments.attachable_id IS 'fk:--polymorph'
);
```

### Model Generation Impact
When using `node ace hefesto:forge:model`, these comments affect the generated model in the following ways:

1. For cross-schema foreign keys:
```typescript
import CustomerModel from '#models/customer_schema/customer'

export default class Order extends HBaseModel {
  @belongsTo(() => CustomerModel)
  declare customer: BelongsTo<typeof CustomerModel>
}
```

2. For polymorphic relationships:
- The column marked with `fk:--polymorph` will not generate a standard relationship
- You'll need to manually implement the polymorphic relationship
