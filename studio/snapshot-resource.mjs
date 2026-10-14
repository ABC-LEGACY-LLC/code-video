// Absolute imported asset references resolve inside a frozen source namespace.
export function snapshotResource(src){
 const prefix=/^(.*\/snapshots\/[a-f0-9]{64})\/w\//.exec(globalThis.location?.pathname||'')?.[1];
 return prefix&&src.startsWith('/w/')?prefix+src:src;
}
