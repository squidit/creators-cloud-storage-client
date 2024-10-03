"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  CreatorsCloudStorageClient: () => CreatorsCloudStorageClient,
  possibleContentTypes: () => possibleContentTypes
});
module.exports = __toCommonJS(src_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
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
      const command = new import_client_s3.GetObjectCommand(parameters);
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
