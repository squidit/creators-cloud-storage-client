import { GetObjectCommandOutput } from '@aws-sdk/client-s3';

type Cloud = 'aws' | 'gcp';
interface Logger {
    Error: (dataToLog: Error | Record<string, unknown>, request?: unknown, response?: unknown, user?: string) => void;
    Info: (message: Record<string, unknown>) => void;
}
interface ErrorConverter {
    Create: (settings: Record<string, unknown>, originalError: unknown) => Error;
}
declare class CreatorsCloudStorageClient {
    private readonly region;
    private readonly loggerInstance;
    private readonly errorConverter;
    private static instance;
    private readonly s3Client;
    private constructor();
    static getInstance(): CreatorsCloudStorageClient;
    static init(region: string, accessKeyId: string, secretAccessKey: string, loggerInstance: Logger, errorConverter: ErrorConverter): void;
    uploadFromUrl(bucketName: string, path: string, fileName: string, originalUrl: string): Promise<string | null>;
    isInBuckets(mediaUrl: string | null, configs: {
        bucket: string;
        cloud: Cloud;
    } | Array<{
        bucket: string;
        cloud: Cloud;
    }>): boolean;
    isInBucket(cloud: 'aws' | 'gcp', bucket: string, mediaUrl: string | null | undefined): mediaUrl is string;
    private getFileExtensionFromUrl;
    uploadFile(bucketName: string, fileName: string, fileContent: Buffer, options?: {
        compress?: boolean;
    }): Promise<void>;
    downloadFile(bucketName: string, fileName: string): Promise<GetObjectCommandOutput>;
    createSignedUploadUrl(bucketName: string, directory: string, fileName: string, contentType: ContentType, expirationInSeconds: number): Promise<{
        publicUrl: string;
        signedUrl: string;
    }>;
    createSignedDownloadUrl(bucketName: string, directory: string, fileName: string, expirationInSeconds: number): Promise<string>;
    private translateContentTypeToExtension;
    private stripQueryString;
}
declare const possibleContentTypes: readonly ["image/jpg", "image/jpeg", "image/png", "application/pdf"];
type ContentType = typeof possibleContentTypes[number];

export { type Cloud, type ContentType, CreatorsCloudStorageClient, possibleContentTypes };
