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
    private constructor();
    static getInstance(): CreatorsCloudStorageClient;
    static init(projectId: string, keyFilename: string, loggerInstance: Logger, errorConverter: ErrorConverter, customTopicName?: string): void;
    uploadFile(bucketName: string, fileName: string, fileContent: Buffer): Promise<void>;
    downloadFile(bucketName: string, fileName: string): Promise<Buffer>;
}

export { CreatorsCloudStorageClient };
