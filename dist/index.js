"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  CreatorsCloudStorageClient: () => CreatorsCloudStorageClient,
  possibleContentTypes: () => possibleContentTypes
});
module.exports = __toCommonJS(src_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_lib_storage = require("@aws-sdk/lib-storage");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_mime_types = __toESM(require("mime-types"));
var import_node_console = __toESM(require("console"));
var import_node_path = __toESM(require("path"));
var import_node_util = require("util");
var import_node_zlib = require("zlib");
var gzip = (0, import_node_util.promisify)(import_node_zlib.gzip);
var CreatorsCloudStorageClient = class _CreatorsCloudStorageClient {
  constructor(region, accessKeyId, secretAccessKey, loggerInstance, errorConverter) {
    this.region = region;
    this.loggerInstance = loggerInstance;
    this.errorConverter = errorConverter;
    this.loggerInstance = loggerInstance;
    this.errorConverter = errorConverter;
    this.s3Client = new import_client_s3.S3Client({
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
        extension = import_mime_types.default.extension(contentTypeFromHeader) ? `.${import_mime_types.default.extension(contentTypeFromHeader)}` : null;
      }
      let contentType = null;
      if (contentTypeFromHeader) {
        contentType = contentTypeFromHeader;
      } else if (extension) {
        contentType = import_mime_types.default.lookup(extension) || null;
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
      const upload = new import_lib_storage.Upload({
        client: this.s3Client,
        params: {
          Body: body,
          Bucket: bucketName,
          ContentType: contentType,
          Key: remoteFileKey
        }
      });
      await upload.done();
      import_node_console.default.debug(`Upload of file ${fileName} to bucket ${bucketName} successful`);
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
  async moveToBucket(currentUrl, targetBucketName) {
    const url = new URL(currentUrl);
    const currentBucketName = url.hostname.split(".")[0];
    const fileKey = url.pathname.slice(1);
    await this.s3Client.send(new import_client_s3.CopyObjectCommand({
      Bucket: targetBucketName,
      CopySource: `${currentBucketName}/${fileKey}`,
      Key: fileKey
    }));
    await this.s3Client.send(new import_client_s3.DeleteObjectCommand({
      Bucket: currentBucketName,
      Key: fileKey
    }));
    return `https://${targetBucketName}.s3.amazonaws.com/${fileKey}`;
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
      return import_node_path.default.extname(pathname) || null;
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
      const command = new import_client_s3.PutObjectCommand(parameters);
      if (options.compress) {
        import_node_console.default.debug(`Compression percentage: ${(parameters.Body.length / fileContent.length * 100).toFixed(2)}% of original size`);
      }
      const response = await this.s3Client.send(command);
      import_node_console.default.debug(`Upload of file ${fileName} to bucket ${bucketName} successful. Response: ${JSON.stringify(response)}`);
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
      const command = new import_client_s3.GetObjectCommand(parameters);
      const response = await this.s3Client.send(command);
      import_node_console.default.debug(`Download of file ${fileName} from bucket ${bucketName} successful.`);
      return response;
    } catch (error) {
      this.loggerInstance.Error(this.errorConverter.Create({ code: "CCSC002", detail: { bucketName, fileName }, message: "Cloud storage file download failure" }, error));
      throw error;
    }
  }
  async createSignedUploadUrl(bucketName, directory, fileName, contentType, expirationInSeconds) {
    const extension = this.translateContentTypeToExtension(contentType);
    const command = new import_client_s3.PutObjectCommand({
      Bucket: bucketName,
      Key: `${directory}/${fileName}.${extension}`
    });
    const signedUrl = await (0, import_s3_request_presigner.getSignedUrl)(this.s3Client, command, { expiresIn: expirationInSeconds });
    return {
      publicUrl: this.stripQueryString(signedUrl),
      signedUrl
    };
  }
  async createSignedDownloadUrl(bucketName, directory, fileName, expirationInSeconds) {
    const command = new import_client_s3.GetObjectCommand({
      Bucket: bucketName,
      Key: `${directory}/${fileName}`
    });
    return await (0, import_s3_request_presigner.getSignedUrl)(this.s3Client, command, { expiresIn: expirationInSeconds });
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreatorsCloudStorageClient,
  possibleContentTypes
});
