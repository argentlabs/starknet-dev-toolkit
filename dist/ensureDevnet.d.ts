export interface EnsureDevnetOptions {
    cwd?: string;
    imageTag?: string;
    containerName?: string;
    port?: string;
    rpcUrlEnv?: string;
    defaultRpcUrl?: string;
    loadDotenv?: boolean;
    forkRpcUrlEnv?: string;
    rm?: boolean;
    dockerBuildExtraArgs?: string[];
    dockerRunExtraArgs?: string[];
}
export declare function ensureDevnet(options?: EnsureDevnetOptions): Promise<void>;
//# sourceMappingURL=ensureDevnet.d.ts.map