# HefestoJS Forge Tools for AdonisJS
Hefesto presents a robust suite of utilities designed to optimize and accelerate the development of RESTful APIs within the AdonisJS ecosystem, focusing on automation, conventions, and integrations like OpenAPI for documentation.

## Installation
To install the package, run the following command inside a AdonisJS project:

```zsh
  npm i @hefestojs/for-adonisjs
```

After installation, verify that the imports have been added to the `adonisrc.ts` file. If not, add the following lines:

```javascript
commands: [
  // outros imports ...
  () => import('@hefestojs/for-adonisjs/commands'),
],

providers: [
  // outros imports ...
  () => import('@hefestojs/for-adonisjs/provider'),
],
```

## Usage
The HefestoJS package allows the import of its resources and the execution of commands to streamline development:

### Importing package features
You can import resources for models, controllers, and exception handling as needed:

For models:
```javascript
import HBaseModel from '@hefestojs/for-adonisjs/model'

export default class AuthAccessToken extends HBaseModel { 
```

For controllers:
```javascript
import HController from '@hefestojs/for-adonisjs/controller'

export default class AuthClientController extends HController {
```

For a pre-defined exception handler:
```javascript
import HExceptionHandler from "@hefestojs/for-adonisjs/exception"

export default class HttpExceptionHandler extends HExceptionHandler {
```

### Available Commands
The following commands are available to facilitate the generation of models and controllers:

```zsh
node ace forge:model --help

node ace forge:controller --help
```

The `forge:controller` command automatically generates REST controllers from database schemas or tables. The generated controllers support CRUD operations (Create, Read, Update, Delete) and include OpenAPI annotations for each method, automatically providing API documentation via the Swagger UI, accessible through the configured route.

### Integration with Swagger UI
To add Swagger UI to your project, update the `routes.ts` file to include the Swagger path:

```javascript
import swagger from '@hefestojs/for-adonisjs/swagger'

router.get('/swagger/:path?', swagger.path)
```

## Final Considerations
Installing and configuring the HefestoJS package adds essential functionalities to accelerate API development with automated documentation, while adhering to best practices in software design and architecture. Utilize the resources provided by the package as needed to maximize efficiency and code quality in your project.

## Contribute
Help improve the development experience of AdonisJS by contributing enhancements to the package. The main goal of the package is to reduce repetitive tasks, allowing developers to focus on the user experience of their software.