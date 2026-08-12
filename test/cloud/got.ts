// Test double for the server-provided `cloud/got` (aliased in vitest.config.ts).
import { got } from "@tothalex/cloud/testing";

export default got;
export const get = got.get;
export const post = got.post;
export const put = got.put;
const _delete = got.delete;
export { _delete as delete };
