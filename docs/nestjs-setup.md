# Utilização: Com injeção de dependência por NestJS

[Retornar ao README.md](../README.md#utilização)

## Adição de variáveis de ambiente
No validador de variáveis de ambiente, adicione as variáveis necessárias para a inicialização do client:

```ts
  CLOUD_STORAGE_CLIENT_REGION: z.string().min(1),
  CLOUD_STORAGE_CLIENT_ACCESS_KEY_ID: z.string().min(1),
  CLOUD_STORAGE_CLIENT_SECRET_ACCESS_KEY: z.string().min(1)
```

## Criação de módulo
1. **Crie um novo módulo para o client.**  
Recomenda-se a criação no diretório `utils/cloud-storage`, com o nome `cloud-storage.module.ts`:

    ```bash
    nest g module utils/cloud-storage
    ```

2. **Popule o módulo com a criação de uma instância do client.**  
No módulo, utilize uma factory para poder injetar o `configService` e obter as variáveis de ambiente na inicialização do client. Entregue o valor da instância como resultado da factory:

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
    
    A instância poderá ser injetada em outras partes da aplicação utilizando o token `'CreatorsCloudStorageClient'`.

3. **Importe o módulo no módulo principal da aplicação, `app.module.ts`**:

    ```ts
    import { CloudStorageModule } from './utils/cloud-storage/cloud-storage.module'

    @Module({
      imports: [
        CloudStorageModule
        ... outros imports aqui
      ]
    })
    export class AppModule {}
    ```
    Como o módulo foi marcado como `@Global()`, ao ser importado no módulo principal ele estará disponível em toda a aplicação.

## Utilização
1. **Para utilizar os métodos do client, injete a instância no construtor do serviço ou controlador:**
    ```ts
    constructor(
      @Inject('CreatorsCloudStorageClient') private readonly creatorsCloudStorageClient: CreatorsCloudStorageClient
    ) {}

    ...

    await this.creatorsCloudStorageClient.createSignedUploadUrl(...)
    ```