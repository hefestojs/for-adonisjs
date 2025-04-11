# Controller Conventions

## Overview
Controllers in HefestoJS follow specific conventions to ensure consistency and maintainability across your AdonisJS application. These conventions are designed to work seamlessly with the built-in features of HefestoJS.

## Base Controller
All controllers should extend the `HBaseController` class:
```typescript
import HBaseController from '@hefestojs/for-adonisjs/controller'

export default class YourController extends HBaseController {
  // Your controller implementation
}
```

## Controller Generation
Controllers can be generated using the `forge:controller` command:
```bash
node ace forge:controller schema.table_name [options]
```

### Generation Options
- `--overwrite`: Overwrites existing controller if it exists
- `--openapi`: Includes OpenAPI specifications in the generated controller

## Response Format
Controllers should follow the standard response format:
```typescript
{
  severity: 'success' | 'error',
  summary: string,    // Brief description of the operation result
  dataset?: any,      // Data payload (for successful operations)
  detail?: string,    // Additional information (especially for errors)
  pagination?: {      // Included when data is paginated
    total: number,
    perPage: number,
    currentPage: number,
    lastPage: number,
    firstPage: number,
    firstPageUrl: string,
    lastPageUrl: string,
    nextPageUrl: string,
    previousPageUrl: string
  }
}
```

## CRUD Operations
Standard CRUD operations should be implemented as follows:
- `index()`: List resources (with pagination)
- `store()`: Create new resource
- `show()`: Retrieve single resource
- `update()`: Update existing resource
- `destroy()`: Delete resource

## OpenAPI Documentation
Controllers should include OpenAPI annotations for API documentation:
```typescript
/**
 * @swagger
 * /api/your-resource:
 *   get:
 *     tags:
 *       - YourResource
 *     summary: List resources
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful operation
 */
```

## Error Handling
Controllers should use the standard error handling provided by `HExceptionHandler`:
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 409: Conflict
- 422: Validation Error
- 500: Internal Server Error
