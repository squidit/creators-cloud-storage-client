import { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { z } from 'czod';
export { z as cz } from 'zod';

interface Logger {
    Info: (message: Record<string, unknown>) => void;
    Error: (dataToLog: Record<string, unknown> | Error, req?: unknown, res?: unknown, user?: string) => void;
}
interface ErrorConverter {
    Create: (settings: Record<string, unknown>, originalError: unknown) => Error;
}
declare class CreatorsCloudStorageClient {
    private static instance;
    private readonly loggerInstance;
    private readonly errorConverter;
    private readonly s3Client;
    private constructor();
    static getInstance(): CreatorsCloudStorageClient;
    static init(region: string, accessKeyId: string, secretAccessKey: string, loggerInstance: Logger, errorConverter: ErrorConverter): void;
    uploadFile(bucketName: string, fileName: string, fileContent: Buffer, options?: {
        compress?: boolean;
    }): Promise<void>;
    downloadFile(bucketName: string, fileName: string): Promise<GetObjectCommandOutput>;
    downloadJson<T extends z.ZodType>(bucketName: string, fileName: string, schema: T): Promise<z.infer<T>>;
}

export { CreatorsCloudStorageClient };
