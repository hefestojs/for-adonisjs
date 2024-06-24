### Getting Ready for Build

Before you can build the main project, make sure to install the required dependencies. Follow these steps:

1. **Install TypeScript Type Definitions for `swagger-jsdoc`:**

   This is required for TypeScript to recognize the types used by `swagger-jsdoc`.

   ```bash
   npm install --save-dev @types/swagger-jsdoc
   ```

2. **Install `swagger-jsdoc` Library:**

   This library is necessary for generating Swagger documentation from JSDoc comments in your project.

   ```bash
   npm install swagger-jsdoc
   ```

By following these steps, you will ensure that your project is set up correctly and ready for the build process. This will help avoid common issues related to missing dependencies and configuration errors.