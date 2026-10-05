/* The harness lives in one place. This file only re-exports it and names the suite:
   a copy per suite would be one more place to go stale. */
import {suiteName, setSuite} from '../../../../harness/lib.mjs';
setSuite(suiteName(import.meta.url));
export * from '../../../../harness/lib.mjs';
