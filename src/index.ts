interface Logger {
  Info: (message: Record<string, unknown>) => void
  Error: (dataToLog: Record<string, unknown> | Error, req?: unknown, res?: unknown, user?: string,) => void
}

interface ErrorConverter {
  Create: (settings: Record<string, unknown>, originalError: unknown) => Error
}

export class CreatorsCloudStorageClient {
  private static instance: CreatorsCloudStorageClient
  private readonly loggerInstance: Logger
  private readonly errorConverter: ErrorConverter

  private constructor (projectId: string, keyFilename: string, loggerInstance: Logger, errorConverter: ErrorConverter) {
    this.loggerInstance = loggerInstance
    this.errorConverter = errorConverter
  }

  public static getInstance (): CreatorsCloudStorageClient {
    if (!CreatorsCloudStorageClient.instance) {
      throw new Error(`${CreatorsCloudStorageClient.name} not initialized`)
    }

    return CreatorsCloudStorageClient.instance
  }

  public static init (projectId: string, keyFilename: string, loggerInstance: Logger, errorConverter: ErrorConverter, customTopicName?: string): void {
    this.instance = new CreatorsCloudStorageClient(projectId, keyFilename, loggerInstance, errorConverter)
  }

  public async uploadFile (bucketName: string, fileName: string, fileContent: Buffer): Promise<void> {
    try {
      console.log(`This is a stub for the uploadFile method. BucketName: ${bucketName}, fileName: ${fileName}, fileContent: ${fileContent.toString()}`)
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ message: 'Cloud storage file upload failure', code: 'CCSC001', detail: { bucketName, fileName, fileContent } }, error))
      throw error
    }
  }

  public async downloadFile (bucketName: string, fileName: string): Promise<Buffer> {
    try {
      const response = `This is a stub for the downloadFile method. BucketName: ${bucketName}, fileName: ${fileName}`
      console.log(response)
      return Buffer.from(response)
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ message: 'Cloud storage file download failure', code: 'CCSC002', detail: { bucketName, fileName } }, error))
      throw error
    }
  }
}
