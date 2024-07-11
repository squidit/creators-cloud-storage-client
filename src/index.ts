import { GetObjectCommand, PutObjectCommand, S3Client, type GetObjectCommandInput, type GetObjectCommandOutput, type PutObjectCommandInput } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { type NodeJsClient } from '@smithy/types'
import { type z as cz } from 'czod'
import { promisify } from 'util'
import { gzip as callbackGzip, createGunzip } from 'zlib'
const gzip = promisify(callbackGzip)

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
  private readonly s3Client: NodeJsClient<S3Client>

  private constructor (region: string, accessKeyId: string, secretAccessKey: string, loggerInstance: Logger, errorConverter: ErrorConverter) {
    this.loggerInstance = loggerInstance
    this.errorConverter = errorConverter
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  }

  public static getInstance (): CreatorsCloudStorageClient {
    if (!CreatorsCloudStorageClient.instance) {
      throw new Error(`${CreatorsCloudStorageClient.name} not initialized`)
    }

    return CreatorsCloudStorageClient.instance
  }

  public static init (region: string, accessKeyId: string, secretAccessKey: string, loggerInstance: Logger, errorConverter: ErrorConverter): void {
    this.instance = new CreatorsCloudStorageClient(region, accessKeyId, secretAccessKey, loggerInstance, errorConverter)
  }

  public async uploadFile (bucketName: string, fileName: string, fileContent: Buffer, options: { compress?: boolean } = {}): Promise<void> {
    try {
      const params: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: fileName,
        Body: options.compress ? await gzip(fileContent) : fileContent,
        ...options.compress && { ContentEncoding: 'gzip' }
      }
      const command = new PutObjectCommand(params)

      if (options.compress) {
        console.debug(`Compression percentage: ${(((params.Body as Buffer)?.length / fileContent.length) * 100).toFixed(2)}% of original size`)
      }

      const response = await this.s3Client.send(command)

      console.debug(`Upload of file ${fileName} to bucket ${bucketName} successful. Response: ${JSON.stringify(response)}`)
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ message: 'Cloud storage file upload failure', code: 'CCSC001', detail: { bucketName, fileName, fileContent } }, error))
      throw error
    }
  }

  public async downloadFile (bucketName: string, fileName: string): Promise<GetObjectCommandOutput> {
    try {
      const params: GetObjectCommandInput = {
        Bucket: bucketName,
        Key: fileName
      }
      const command = new GetObjectCommand(params)

      const response = await this.s3Client.send(command)

      console.debug(`Download of file ${fileName} from bucket ${bucketName} successful.`)
      return response
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ message: 'Cloud storage file download failure', code: 'CCSC002', detail: { bucketName, fileName } }, error))
      throw error
    }
  }

  public async downloadJson<T extends cz.ZodType> (bucketName: string, fileName: string, schema: T): Promise<cz.infer<T>> {
    const downloadResult = await this.downloadFile(bucketName, fileName)
    if (!downloadResult.Body) {
      throw new Error('No body in file content')
    }


    let jsonString: string
    if (downloadResult.ContentEncoding === 'gzip') {
      const fileBuffer = Buffer.from(await downloadResult.Body.transformToByteArray())
      console.log(`Decompressing file ${fileName} from bucket ${bucketName}`)

      const unzippedResult: Buffer = await new Promise((resolve, reject) => {
        const gunzip = createGunzip()
        gunzip.on('data', decompressedChunk => {
          resolve(Buffer.concat([decompressedChunk]))
        })

        gunzip.on('error', (err) => {
          reject(err)
        })

        gunzip.write(fileBuffer)
        gunzip.end()
      })

      jsonString = unzippedResult.toString()
    } else {
      jsonString = await downloadResult.Body.transformToString()
    }
    const json = JSON.parse(jsonString)
    return schema.parse(json)
  }

  public async createSignedUploadUrl (bucketName: string, fileName: string, expirationInSeconds: number): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName
      })

      const signedUrl = getSignedUrl(this.s3Client, command, { expiresIn: expirationInSeconds })

      return signedUrl
  }
}

export { z as cz } from 'zod'
