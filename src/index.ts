import { GetObjectCommand, PutObjectCommand, S3Client, type GetObjectCommandInput, type GetObjectCommandOutput, type PutObjectCommandInput } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { type NodeJsClient } from '@smithy/types'
import { promisify } from 'node:util'
import { gzip as callbackGzip } from 'node:zlib'
const gzip = promisify(callbackGzip)

interface Logger {
  Error: (dataToLog: Error | Record<string, unknown>, request?: unknown, response?: unknown, user?: string,) => void
  Info: (message: Record<string, unknown>) => void
}

interface ErrorConverter {
  Create: (settings: Record<string, unknown>, originalError: unknown) => Error
}

export class CreatorsCloudStorageClient {
  private static instance: CreatorsCloudStorageClient | undefined
  private readonly s3Client: NodeJsClient<S3Client>

  private constructor(private readonly region: string, accessKeyId: string, secretAccessKey: string, private readonly loggerInstance: Logger, private readonly errorConverter: ErrorConverter) {
    this.loggerInstance = loggerInstance
    this.errorConverter = errorConverter
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    })
  }

  public static getInstance(): CreatorsCloudStorageClient {
    if (!CreatorsCloudStorageClient.instance) {
      throw new Error(`${CreatorsCloudStorageClient.name} not initialized`)
    }

    return CreatorsCloudStorageClient.instance
  }

  public static init(region: string, accessKeyId: string, secretAccessKey: string, loggerInstance: Logger, errorConverter: ErrorConverter): void {
    this.instance = new CreatorsCloudStorageClient(region, accessKeyId, secretAccessKey, loggerInstance, errorConverter)
  }

  public async uploadFile(bucketName: string, fileName: string, fileContent: Buffer, options: { compress?: boolean } = {}): Promise<void> {
    try {
      const parameters: PutObjectCommandInput = {
        Body: options.compress ? await gzip(fileContent) : fileContent,
        Bucket: bucketName,
        Key: fileName,
        ...options.compress && { ContentEncoding: 'gzip' },
      }
      const command = new PutObjectCommand(parameters)

      if (options.compress) {
        console.debug(`Compression percentage: ${(((parameters.Body as Buffer).length / fileContent.length) * 100).toFixed(2)}% of original size`)
      }

      const response = await this.s3Client.send(command)

      console.debug(`Upload of file ${fileName} to bucket ${bucketName} successful. Response: ${JSON.stringify(response)}`)
    }
    catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ code: 'CCSC001', detail: { bucketName, fileContent, fileName }, message: 'Cloud storage file upload failure' }, error))
      throw error
    }
  }

  public async downloadFile(bucketName: string, fileName: string): Promise<GetObjectCommandOutput> {
    try {
      const parameters: GetObjectCommandInput = {
        Bucket: bucketName,
        Key: fileName,
      }
      const command = new GetObjectCommand(parameters)

      const response = await this.s3Client.send(command)

      console.debug(`Download of file ${fileName} from bucket ${bucketName} successful.`)
      return response
    }
    catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ code: 'CCSC002', detail: { bucketName, fileName }, message: 'Cloud storage file download failure' }, error))
      throw error
    }
  }

  public async createSignedUploadUrl(bucketName: string, directory: string, fileName: string, contentType: ContentType, expirationInSeconds: number): Promise<{ publicUrl: string, signedUrl: string }> {
    const extension = this.translateContentTypeToExtension(contentType)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${directory}/${fileName}.${extension}`,
    })

    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expirationInSeconds })
    return {
      publicUrl: this.stripQueryString(signedUrl),
      signedUrl,
    }
  }

  public async createSignedDownloadUrl(bucketName: string, directory: string, fileName: string, expirationInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `${directory}/${fileName}`,
    })

    return await getSignedUrl(this.s3Client, command, { expiresIn: expirationInSeconds })
  }

  private translateContentTypeToExtension(contentType: ContentType): string {
    return {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
    }[contentType]
  }

  private stripQueryString(urlString: string): string {
    const url = new URL(urlString)
    url.search = ''
    return url.toString()
  }
}

export const possibleContentTypes = ['image/jpg', 'image/jpeg', 'image/png', 'application/pdf'] as const
export type ContentType = typeof possibleContentTypes[number]
