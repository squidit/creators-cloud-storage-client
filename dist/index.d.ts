import { GetObjectCommandOutput } from '@aws-sdk/client-s3';

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

export { type ContentType, CreatorsCloudStorageClient, possibleContentTypes };
