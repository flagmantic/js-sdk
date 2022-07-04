# Flagmantic JS/TS SDK

This SDK facilitates using the client APIs provided by [Flagmantic](https://flagmantic.com)

# Install
```sh
npm i @firstkind/sdk
```

# Usage
```js
import { fetchFlag } from "@firstkind/sdk";

async function loadPage() {
  const targetingResult = await fetchFlag({
    apiKey: "pk_FpACzwidBsbDiaqPloKnCfESozthonuuLbGYSLvb",
    userId: "u-1234",
    projectKey: "example-app",
    environmentKey: "development",
    flagKey: "show-new-loading-screen",
    defaultValue: false,
  });

  if (targetingResult) {
    return "new loading screen";
  } else {
    return "old loading screen";
  }
}
```

Types

```typescript
interface FetchFlagArgs<T> {
  // An optional user ID to allow for user based targeting
  userId?: string;
  // This is a public key, and doesn't need to be kept secret
  apiKey: string;
  // The key of the project you're querying
  projectKey: string;
  // The key of the environment you're querying
  environmentKey: string;
  // The key of the flag you're querying
  flagKey: string;
  // An optional default value, will return undefined otherwise
  defaultValue?: T;
  // Whether or not to cache responses, defaults to true
  useCache?: boolean;
  // How long to cache, defaults to 60 seconds
  cacheDuration?: {
        interval: Interval;
        duration: number;
    };
}
export declare type Interval = "year" | "quarter" | "month" | "week" | "day" | "hour" | "minute" | "second";
export declare function fetchFlag<T>({
  userId,
  apiKey,
  projectKey,
  environmentKey,
  flagKey,
  defaultValue,
  useCache,
  cacheDuration,
}: FetchFlagArgs<T>): Promise<T | undefined>;
```
