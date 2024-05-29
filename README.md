# Hefesto plugin for AdonisJS
Hefesto apresenta uma suite robusta de utilitários que visam otimizar e acelerar o desenvolvimento de APIs RESTful dentro do ecossistema AdonisJS, focando em automatizações, convenções e integrações, como OpenAPI para documentação.

# Instalação
Para instalar o plugin Hefesto, siga os passos abaixo:

Clone o repositório do plugin dentro do seu projeto AdonisJS na pasta `plugins/hefesto`:
```zsh
  git clone https://github.com/hefestojs/adonisjs-plugin.git plugins/hefesto
```

Instale as dependências necessárias, incluindo o `@adonisjs/lucid` para que os arquivos possam ser gerados baseados na estrutura do banco de dados:

```zsh
  node ace configure @adonisjs/lucid
```

# Configuração
Após a instalação, você precisa configurar seu projeto para usar o plugin:

No arquivo package.json, adicione um álias para os arquivos do plugin:
```json
"imports": {
    "#hefesto/*": "./plugins/hefesto/*.js"
}
```

No arquivo tsconfig.json, adicione aqui também um álias para os arquivos JavaScript do plugin:
```json
"compilerOptions": {
    "paths": {
      "#hefesto/*": ["./plugins/hefesto/*.js"],
    }
}
```

No arquivo adonisrc.ts, importe os comandos fornecidos pelo plugin:

```javascript
commands: [
    () => import('#hefesto/commands'),
],
```

# Uso
O plugin Hefesto permite a importação dos seus recursos e a execução de comandos para facilitar o desenvolvimento:

## Importação de Recursos
Você pode importar models, controllers e utilizar o tratamento de exceções do plugin conforme necessário:

for models:
```javascript
import AppModel from '#hefesto/app/model'

export default class AuthAccessToken extends AppModel { 
```

for controllers:
```javascript
import AppController from '#hefesto/app/controller'

export default class AuthClientController extends AppController {
```

for a pre-defined exception handler:
```javascript
import AppException from "#hefesto/app/exception"

export default class HttpExceptionHandler extends AppException {
```

## Comandos Disponíveis
Os comandos a seguir estão disponíveis para facilitar a geração de models e controllers:

```zsh
node ace forge:model --help

node ace forge:controller --help
```
O comando forge:controller gera automaticamente controladores REST a partir de schemas ou tabelas do banco de dados. Os controllers gerados suportam as operações CRUD (Create, Read, Update, Delete) e incluem anotações OpenAPI para cada método, automaticamente disponibilizando a documentação da API pela UI do Swagger, acessível pela rota configurada.

## Integração com Swagger UI
Para adicionar o Swagger UI ao seu projeto, atualize o arquivo routes.ts para incluir o caminho do Swagger:

```javascript
import swagger from '#hefesto/app/swagger'

router.get('/swagger/:path?', swagger.path)
```

### Considerações Finais
A instalação e configuração do plugin Hefesto acrescentam funcionalidades essenciais para acelerar o desenvolvimento de APIs com documentação automatizada, além de seguir as boas práticas de design e arquitetura de software. Utilize os recursos fornecidos pelo plugin conforme a necessidade de seu projeto para maximizar sua eficiência e qualidade do código.