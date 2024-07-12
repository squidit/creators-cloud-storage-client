## Utilização: Com injeção de dependência por tsyringe

[Retornar ao README.md](../README.md#utilização)

## Inicialização
1. **Inicialize o client.**  
Na inicialização da sua aplicação, inclua o client e inicialize-o com as variáveis de ambiente:
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
1. **Registre a instância no container de injeção de dependência:**
    ```ts
    container.register(
        'CreatorsCloudStorageClient', 
        { useValue: CreatorsCloudStorageClient.getInstance() }
      )
    ```
    A instância poderá ser injetada em outras partes da aplicação utilizando o token `'CreatorsCloudStorageClient'`.


## Utilização
1. **Para utilizar os métodos do client, injete a instância no construtor do serviço ou controlador:**
    ```ts
    constructor(
      @inject('CreatorsCloudStorageClient') private readonly creatorsCloudStorageClient: CreatorsCloudStorageClient
    ) {}

    ...

    await this.creatorsCloudStorageClient.createSignedUploadUrl(...)
    ```