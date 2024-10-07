jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    // eslint-disable-next-line unicorn/no-useless-undefined
    done: jest.fn().mockResolvedValue(undefined),
  })),
}))

import { Upload } from '@aws-sdk/lib-storage'
import { CreatorsCloudStorageClient } from './index'

describe('CreatorsCloudStorageClient', () => {
  describe('isInBucket', () => {
    let client: CreatorsCloudStorageClient

    beforeAll(() => {
      // Mock the logger and errorConverter
      const logger = {
        Error: jest.fn(),
        Info: jest.fn(),
      }
      const errorConverter = {
        Create: jest.fn(),
      }

      // Initialize the client
      CreatorsCloudStorageClient.init('us-east-1', 'fakeAccessKeyId', 'fakeSecretAccessKey', logger, errorConverter)
      client = CreatorsCloudStorageClient.getInstance()
    })

    it('should return false if mediaUrl is null', () => {
      const result = client.isInBucket('aws', 'my-bucket', null)
      expect(result).toBe(false)
    })

    it('should return false if mediaUrl is undefined', () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      const result = client.isInBucket('aws', 'my-bucket', undefined)
      expect(result).toBe(false)
    })

    it('should return true for AWS bucket URL', () => {
      const result = client.isInBucket('aws', 'my-bucket', 'https://my-bucket.s3.amazonaws.com/myfile.jpg')
      expect(result).toBe(true)
    })

    it('should return false for incorrect AWS bucket URL', () => {
      const result = client.isInBucket('aws', 'my-bucket', 'https://my-bucket-2.s3.amazonaws.com/myfile.jpg')
      expect(result).toBe(false)
    })

    it('should return true for GCP bucket URL', () => {
      const result = client.isInBucket('gcp', 'my-bucket', 'https://storage.googleapis.com/my-bucket/myfile.jpg')
      expect(result).toBe(true)
    })

    it('should return false for incorrect GCP bucket URL', () => {
      const result = client.isInBucket('gcp', 'my-bucket', 'https://storage.googleapis.com/my-bucket-2/myfile.jpg')
      expect(result).toBe(false)
    })

    it('should return false for unsupported cloud provider', () => {
      const result = client.isInBucket('azure' as 'aws', 'my-bucket', 'https://my-bucket.blob.core.windows.net/myfile.jpg')
      expect(result).toBe(false)
    })

    jest.mock('@aws-sdk/lib-storage', () => ({
      Upload: jest.fn().mockImplementation(() => ({
        // eslint-disable-next-line unicorn/no-useless-undefined
        done: jest.fn().mockResolvedValue(undefined),
      })),
    }))
  })

  describe('uploadFromUrl', () => {
    let client: CreatorsCloudStorageClient
    let fetchMock: jest.Mock

    beforeAll(() => {
      // Mock the logger and errorConverter
      const logger = {
        Error: jest.fn(),
        Info: jest.fn(),
      }
      const errorConverter = {
        Create: jest.fn(),
      }

      // Initialize the client
      CreatorsCloudStorageClient.init('us-east-1', 'fakeAccessKeyId', 'fakeSecretAccessKey', logger, errorConverter)
      client = CreatorsCloudStorageClient.getInstance()
    })

    beforeEach(() => {
      jest.clearAllMocks()
      fetchMock = jest.fn()
      global.fetch = fetchMock
    })

    it('should return null if content type is not determined', async () => {
      fetchMock.mockResolvedValue({
        body: 'fakeBody',
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        ok: true,
      })

      const result = await client.uploadFromUrl('my-bucket', 'path', 'file', 'http://example.com/file')
      expect(result).toBeNull()
      // @ts-expect-error accessing private method for testing
      expect(client.loggerInstance.Error).toHaveBeenCalledWith({
        detail: { fileName: 'file', originalUrl: 'http://example.com/file', path: 'path' },
        message: 'no content type',
      })
    })

    it('should return null if fetch response is not ok', async () => {
      fetchMock.mockResolvedValue({
        body: 'fakeBody',
        headers: {
          get: jest.fn().mockReturnValue('image/jpeg'),
        },
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const result = await client.uploadFromUrl('my-bucket', 'path', 'file', 'http://example.com/file')
      expect(result).toBeNull()
      // @ts-expect-error accessing private method for testing
      expect(client.loggerInstance.Error).toHaveBeenCalledWith({
        detail: { fileName: 'file', originalUrl: 'http://example.com/file', path: 'path', status: 404 },
        message: 'Fetch error: Not Found',
      })
    })

    it('should return null if fetch response body is null', async () => {
      fetchMock.mockResolvedValue({
        body: null,
        headers: {
          get: jest.fn().mockReturnValue('image/jpeg'),
        },
        ok: true,
      })

      const result = await client.uploadFromUrl('my-bucket', 'path', 'file', 'http://example.com/file')
      expect(result).toBeNull()

      // @ts-expect-error accessing private method for testing
      expect(client.loggerInstance.Error).toHaveBeenCalledWith({
        detail: { fileName: 'file', originalUrl: 'http://example.com/file', path: 'path' },
        message: 'no body',
      })
    })

    it('should upload file and return URL on success', async () => {
      fetchMock.mockResolvedValue({
        body: 'fakeBody',
        headers: {
          get: jest.fn().mockReturnValue('image/jpeg'),
        },
        ok: true,
      })

      const result = await client.uploadFromUrl('my-bucket', 'path', 'file', 'http://example.com/file')
      expect(result).toBe('https://my-bucket.s3.amazonaws.com/path/file.jpeg')
      expect(Upload).toHaveBeenCalledWith({
        // @ts-expect-error accessing private method for testing
        client: client.s3Client,
        params: {
          Body: 'fakeBody',
          Bucket: 'my-bucket',
          ContentType: 'image/jpeg',
          Key: 'path/file.jpeg',
        },
      })
      // @ts-expect-error accessing private method for testing
      expect(client.loggerInstance.Error).not.toHaveBeenCalled()
    })

    it('should log error and throw if upload fails', async () => {
      fetchMock.mockResolvedValue({
        body: 'fakeBody',
        headers: {
          get: jest.fn().mockReturnValue('image/jpeg'),
        },
        ok: true,
      })

      const uploadError = new Error('Upload failed')
        ;(Upload as unknown as jest.Mock).mockImplementationOnce(() => ({
        done: jest.fn().mockRejectedValue(uploadError),
      }))

      await expect(client.uploadFromUrl('my-bucket', 'path', 'file', 'http://example.com/file')).rejects.toThrow(uploadError)
    })
  })
})
