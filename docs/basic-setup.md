# Utilização: Sem injeção de dependência

[Retornar ao README.md](../README.md#utilização)

## Inicialização
Na inicialização da sua aplicação, inclua o client e inicialize-o com as variáveis de ambiente:
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
 ## Utilização
Depois, basta utilizar a instância com o método `getInstance()`:
```ts
await CreatorsCloudStorageClient
.getInstance()
.createSignedUploadUrl(...)
```