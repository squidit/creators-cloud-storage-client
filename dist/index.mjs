// src/index.ts
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import mimeTypes from "mime-types";
import console from "node:console";
import path from "node:path";
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
  async uploadFromUrl(bucketName, path2, fileName, originalUrl) {
    try {
      const fetchResponse = await fetch(originalUrl, { method: "GET" });
      const extensionFromUrl = this.getFileExtensionFromUrl(originalUrl);
      const contentTypeFromHeader = fetchResponse.headers.get("content-type");
      let extension = null;
      if (extensionFromUrl) {
        extension = extensionFromUrl;
      } else if (contentTypeFromHeader) {
        extension = mimeTypes.extension(contentTypeFromHeader) ? `.${mimeTypes.extension(contentTypeFromHeader)}` : null;
      }
      let contentType = null;
      if (contentTypeFromHeader) {
        contentType = contentTypeFromHeader;
      } else if (extension) {
        contentType = mimeTypes.lookup(extension) || null;
      }
      if (!contentType) {
        this.loggerInstance.Error({ detail: { fileName, originalUrl, path: path2 }, message: "no content type" });
        return null;
      }
      if (!fetchResponse.ok) {
        this.loggerInstance.Error({ detail: { fileName, originalUrl, path: path2, status: fetchResponse.status }, message: `Fetch error: ${fetchResponse.statusText}` });
        return null;
      }
      const body = fetchResponse.body;
      if (!body) {
        this.loggerInstance.Error({ detail: { fileName, originalUrl, path: path2 }, message: "no body" });
        return null;
      }
      const remoteFileKey = `${path2}/${fileName}${extension}`;
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Body: body,
          Bucket: bucketName,
          ContentType: contentType,
          Key: remoteFileKey
        }
      });
      upload.on("httpUploadProgress", (progress) => {
        console.debug(`Upload progress: ${JSON.stringify(progress, null, 2)}`);
      });
      await upload.done();
      console.debug(`Upload of file ${fileName} to bucket ${bucketName} successful`);
      return `https://${bucketName}.s3.amazonaws.com/${remoteFileKey}`;
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ code: "CCSC001", detail: { bucketName, fileName, path: path2 }, message: "Cloud storage file upload failure" }, error));
      throw error;
    }
  }
  isInBuckets(mediaUrl, configs) {
    if (!mediaUrl) {
      return false;
    }
    if (!Array.isArray(configs)) {
      configs = [configs];
    }
    for (const config of configs) {
      if (this.isInBucket(config.cloud, config.bucket, mediaUrl)) {
        return true;
      }
    }
    return false;
  }
  isInBucket(cloud, bucket, mediaUrl) {
    if (!mediaUrl) {
      return false;
    }
    let cloudUrl;
    switch (cloud) {
      case "aws": {
        cloudUrl = `https://${bucket}.s3.amazonaws.com`;
        break;
      }
      case "gcp": {
        cloudUrl = `https://storage.googleapis.com/${bucket}`;
        break;
      }
      default: {
        return false;
      }
    }
    return mediaUrl.includes(cloudUrl);
  }
  getFileExtensionFromUrl(urlString) {
    try {
      const url = new URL(urlString);
      const pathname = url.pathname;
      return path.extname(pathname) || null;
    } catch {
      return null;
    }
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
