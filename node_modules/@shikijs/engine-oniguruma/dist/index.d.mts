import { L as LoadWasmOptions, R as RegexEngine } from './chunk-index.d.mjs';

declare function loadWasm(options: LoadWasmOptions): Promise<void>;

declare function createWasmOnigEngine(options?: LoadWasmOptions | null): Promise<RegexEngine>;

export { createWasmOnigEngine, loadWasm };
