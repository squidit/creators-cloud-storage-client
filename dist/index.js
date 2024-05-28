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
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  CreatorsCloudStorageClient: () => CreatorsCloudStorageClient
});
module.exports = __toCommonJS(src_exports);
var CreatorsCloudStorageClient = class _CreatorsCloudStorageClient {
  constructor(projectId, keyFilename, loggerInstance, errorConverter) {
    this.loggerInstance = loggerInstance;
    this.errorConverter = errorConverter;
  }
  static getInstance() {
    if (!_CreatorsCloudStorageClient.instance) {
      throw new Error(`${_CreatorsCloudStorageClient.name} not initialized`);
    }
    return _CreatorsCloudStorageClient.instance;
  }
  static init(projectId, keyFilename, loggerInstance, errorConverter, customTopicName) {
    this.instance = new _CreatorsCloudStorageClient(projectId, keyFilename, loggerInstance, errorConverter);
  }
  uploadFile(bucketName, fileName, fileContent) {
    return __async(this, null, function* () {
      try {
        console.log(`This is a stub for the uploadFile method. BucketName: ${bucketName}, fileName: ${fileName}, fileContent: ${fileContent.toString()}`);
      } catch (error) {
        this.loggerInstance.Error(this.errorConverter.Create({ message: "Cloud storage file upload failure", code: "CCSC001", detail: { bucketName, fileName, fileContent } }, error));
        throw error;
      }
    });
  }
  downloadFile(bucketName, fileName) {
    return __async(this, null, function* () {
      try {
        const response = `This is a stub for the downloadFile method. BucketName: ${bucketName}, fileName: ${fileName}`;
        console.log(response);
        return Buffer.from(response);
      } catch (error) {
        this.loggerInstance.Error(this.errorConverter.Create({ message: "Cloud storage file download failure", code: "CCSC002", detail: { bucketName, fileName } }, error));
        throw error;
      }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreatorsCloudStorageClient
});
