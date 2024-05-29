import swaggerJSDoc from 'swagger-jsdoc'
import path from 'node:path'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'
import { HttpContext } from '@adonisjs/core/http'

export default class AppSwagger {

    static async path(ctx: HttpContext) {
        switch (ctx.params['path']) {
            case undefined:
                return AppSwagger.ui(ctx);
            case 'json':
                return AppSwagger.json(ctx);
            case 'ui':
                return AppSwagger.ui(ctx);
            default:
                const filePath = app.relativePath(`./node_modules/swagger-ui-dist/${ctx.params['path']}`);
                return ctx.response.download(filePath);
        }
    }

    static async json(ctx: HttpContext) {

        const currentFilePath = new URL(import.meta.url).pathname
        const { default: packageJson } = await import(path.resolve(currentFilePath, '../../package.json'), {
            assert: {
                type: "json",
            },
        });

        const options = {
            definition: {
                openapi: '3.1.0',
                info: {
                    title: packageJson.name,
                    version: packageJson.version,
                    description: packageJson.description,
                },
            },
            apis: ['./app/**/*.ts', './plugins/hefestojs/docs/**/*.yml'],
        };

        const specs = swaggerJSDoc(options);
        return ctx.response.json(specs);
    }

    static async ui(ctx: HttpContext) {
        const indexFile = path.resolve('./plugins/hefestojs/resources/swagger.html');
        let indexContent = await fs.promises.readFile(indexFile, 'utf8');
            indexContent = indexContent.replace('_SWAGGER_JSON_', '/swagger/json');

        ctx.response.type('.html');
        return ctx.response.send(indexContent);
    }
}