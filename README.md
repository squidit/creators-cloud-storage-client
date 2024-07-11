<p align="center">
    <img 
    src="https://img.icons8.com/?size=128&format=png&color=737373&id=43453"
    width="128px" 
    align="center" 
    alt="logo" 
    />
    <h1 align="center">Submodule | Cloud Storage Client</h1>
    <p align="center">Submódulo responsável por padronizar o acesso de leitura e escrita a arquivos em cloud storage.</p>
</p>

## Instalação
1. Na pasta raíz do serviço que deseja incluir esse submódulo, crie um diretório (se não existente) chamado libraries:
    ```bash
    mkdir libraries
    ```

2. Dentro da pasta libraries , adicione esse repositório como submódulo:

    ```bash
    cd libraries
    git submodule add git@github.com:squidit/creators-cloud-storage-client.git
    ```

    > Isso faz com que o commit de sua aplicação em NodeJS seja vinculado ao hash do commit da biblioteca. Ou seja, o código fonte da biblioteca não será commitado junto com a sua aplicação, mas apenas "linkado" ao commit dela em seu próprio repositório.

3. Retorne ao diretório raiz do projeto, e inicialize todos os submódulos e suas dependências com o comando:

    ```bash
    cd ..
    git submodule update --init --recursive
    ```
    > Tal comando é o responsável por baixar todos os códigos fontes das bibliotecas e suas dependências.

4. Vincule o submódulo do git ao package.json:

    * npm
        ```bash
        npm install --save file:libraries/creators-cloud-storage-client
        ```
    * pnpm
        ```bash
        pnpm add file:libraries/creators-cloud-storage-client
        ```

    > Dessa forma, os as bibliotecas locais são incluidas como dependências no gerenciador de pacotes (npm, yarn, pnpm etc). Isso permite que, no código, você possa fazer uso das bibliotecas através de um require { SquidError, SquidLogger } from 'squid-observability' sem se preocupar com o diretório onde essas bibliotecas estão instaladas. Além disso, o gerenciador de pacotes garante que, caso as bibliotecas instaladas via submódulos tenham dependências em comum com sua aplicação, somente uma cópia do código fonte dessas bibliotecas será vinculada a ela, consequentemente reduzindo o tamanho final da aplicação.  
    > Outra vantagem de vincular o submódulo com o package.json é transferir a responsabilidade de instalar as dependencias dos submódulos ao package manager. Ou seja, se uma biblioteca em submódulo fizer uso da lodash, o npm ou yarn da aplicação pai é quem irá instalar essa dependência ao rodarmos npm install.


## Utilização: Sem injeção de dependência
1. Na inicialização da sua aplicação, inclua o client e inicialize-o com as variáveis de ambiente:
    ```ts
    const { CreatorsCloudStorageClient } = require('creators-cloud-storage-client')

    ...

    CreatorsCloudStorageClient.init(
      CLOUD_STORAGE_CLIENT_REGION,            // variável de ambiente contendo a região da cloud
      CLOUD_STORAGE_CLIENT_ACCESS_KEY_ID,     // variável de ambiente contendo o id da service account
      CLOUD_STORAGE_CLIENT_SECRET_ACCESS_KEY  // variável de ambiente contendo o secret da service account
      SquidLogger,                            // Instância do SquidLogger
      SquidError,                             // Instância do SquidError
    )
    ```

1. Depois, basta utilizar o client para download e upload de arquivos:
    ```ts
    await CreatorsCloudStorageClient.downloadJson(...)
    ```

## Utilização: Com injeção de dependência por tsyringe
1. Na inicialização da sua aplicação, inclua o client e inicialize-o com as variáveis de ambiente:
    ```typescript
    import { CreatorsCloudStorageClient } from 'creators-cloud-storage-client'

    ...

    CreatorsCloudStorageClient.init(
      CLOUD_STORAGE_CLIENT_REGION,            // variável de ambiente contendo a região da cloud
      CLOUD_STORAGE_CLIENT_ACCESS_KEY_ID,     // variável de ambiente contendo o id da service account
      CLOUD_STORAGE_CLIENT_SECRET_ACCESS_KEY  // variável de ambiente contendo o secret da service account
      SquidLogger,                            // Instância do SquidLogger
      SquidError,                             // Instância do SquidError
    )
    ```
1. Após a inicialização, registre a instância no container de injeção de dependência:
    ```ts
    container.register('CreatorsCloudStorageClient', { useValue: CreatorsCloudStorageClient.getInstance() })
    ```

1. Para enviar uma notificação, obtenha o client do container e utilize a instância obtida:
    ```ts
    constructor(
      @inject('CreatorsCloudStorageClient') private readonly creatorsCloudStorageClient: CreatorsCloudStorageClient
    ) {}

    ...

    await this.creatorsCloudStorageClient.downloadJson(...)
    ```


## Utilização: Com injeção de dependência por NestJS
1. Crie um novo módulo para o client.
Utilize uma factory para poder injetar o configService e obter as variáveis de ambiente na inicialização do client.  
Entregue o valor da instância como resultado da factory:
    ```ts
    @Global()
    @Module({
      providers: [
        {
          provide: 'CreatorsCloudStorageClient',
          useFactory: (configService: ConfigService<EnvironmentVariables>) => {
            CreatorsCloudStorageClient.init(
              configService.getOrThrow('CLOUD_STORAGE_CLIENT_REGION'),
              configService.getOrThrow('CLOUD_STORAGE_CLIENT_ACCESS_KEY_ID'),
              configService.getOrThrow('CLOUD_STORAGE_CLIENT_SECRET_ACCESS_KEY'),
              SquidLogger,
              SquidError
            )
            return CreatorsCloudStorageClient.getInstance()
          },
          inject: [ConfigService]
        }
      ],
      exports: ['CreatorsCloudStorageClient']
    })
    export class CloudStorageModule { }
    ```
<!-- TODO: falar sobre criar variáveis de ambiente -->
1. Para enviar uma notificação, obtenha o client do container e utilize a instância obtida:
    ```ts
    constructor(
      @Inject('CreatorsCloudStorageClient') private readonly creatorsCloudStorageClient: CreatorsCloudStorageClient
    ) {}

    ...

    await this.creatorsCloudStorageClient.downloadJson(...)
    ```