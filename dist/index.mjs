// src/index.ts
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { promisify } from "node:util";
import { gzip as callbackGzip } from "node:zlib";
var gzip = promisify(callbackGzip);
var CreatorsCloudStorageClient = class _CreatorsCloudStorageClient {
  constructor(region, accessKeyId, secretAccessKey, loggerInstance, errorConverter) {
    this.region = region;
    this.loggerInstance = loggerInstance;
    this.errorConverter = errorConverter;
    this.loggerInstance = loggerInstance;
    this.errorConverter = errorConverter;
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      region
    });
  }
  static instance;
  s3Client;
  static getInstance() {
    if (!_CreatorsCloudStorageClient.instance) {
      throw new Error(`${_CreatorsCloudStorageClient.name} not initialized`);
    }
    return _CreatorsCloudStorageClient.instance;
  }
  static init(region, accessKeyId, secretAccessKey, loggerInstance, errorConverter) {
    this.instance = new _CreatorsCloudStorageClient(region, accessKeyId, secretAccessKey, loggerInstance, errorConverter);
  }
  async uploadFile(bucketName, fileName, fileContent, options = {}) {
    try {
      const parameters = {
        Body: options.compress ? await gzip(fileContent) : fileContent,
        Bucket: bucketName,
        Key: fileName,
        ...options.compress && { ContentEncoding: "gzip" }
      };
      const command = new PutObjectCommand(parameters);
      if (options.compress) {
        console.debug(`Compression percentage: ${(parameters.Body.length / fileContent.length * 100).toFixed(2)}% of original size`);
      }
      const response = await this.s3Client.send(command);
      console.debug(`Upload of file ${fileName} to bucket ${bucketName} successful. Response: ${JSON.stringify(response)}`);
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ code: "CCSC001", detail: { bucketName, fileContent, fileName }, message: "Cloud storage file upload failure" }, error));
      throw error;
    }
  }
  async downloadFile(bucketName, fileName) {
    try {
      const parameters = {
        Bucket: bucketName,
        Key: fileName
      };
      const command = new GetObjectCommand(parameters);
      const response = await this.s3Client.send(command);
      console.debug(`Download of file ${fileName} from bucket ${bucketName} successful.`);
      return response;
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ code: "CCSC002", detail: { bucketName, fileName }, message: "Cloud storage file download failure" }, error));
      throw error;
    }
  }
  async createSignedUploadUrl(bucketName, directory, fileName, contentType, expirationInSeconds) {
    const extension = this.translateContentTypeToExtension(contentType);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${directory}/${fileName}.${extension}`
    });
    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expirationInSeconds });
    return {
      publicUrl: this.stripQueryString(signedUrl),
      signedUrl
    };
  }
  async createSignedDownloadUrl(bucketName, directory, fileName, expirationInSeconds) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `${directory}/${fileName}`
    });
    return await getSignedUrl(this.s3Client, command, { expiresIn: expirationInSeconds });
  }
  translateContentTypeToExtension(contentType) {
    return {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png"
    }[contentType];
  }
  stripQueryString(urlString) {
    const url = new URL(urlString);
    url.search = "";
    return url.toString();
  }
};
var possibleContentTypes = ["image/jpg", "image/jpeg", "image/png", "application/pdf"];
export {
  CreatorsCloudStorageClient,
  possibleContentTypes
};
