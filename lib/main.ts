export interface FetchFlagArgs<T> {
  userId?: string;
  apiKey: string;
  projectKey: string;
  environmentKey: string;
  flagKey: string;
  defaultValue?: T;
  useCache?: boolean;
  cacheDuration?: { interval: Interval; duration: number };
}

export type FetchFlagsArgs<T> = Omit<FetchFlagArgs<T>, "flagKey"> & {
  flagKeys: string[];
  resolveRemotely?: boolean;
  defaultValue: { [key: string]: any };
};

type FetchFlagsRemotelyArgs = Omit<
  Omit<FetchFlagsArgs<any>, "useCache">,
  "cacheDuration"
>;

interface CachedValue {
  expires_at: string;
  value: any;
}

export type Interval =
  | "year"
  | "quarter"
  | "month"
  | "week"
  | "day"
  | "hour"
  | "minute"
  | "second";

const zip = <X, Y>(a: X[], b: Y[]) => a.map((k, i) => [k, b[i]]);

function dateAdd(
  date: Date,
  interval: Interval,
  units: number
): Date | undefined {
  if (!(date instanceof Date)) return undefined;
  var ret = new Date(date); //don't change original date
  var checkRollover = function () {
    if (ret.getDate() != date.getDate()) ret.setDate(0);
  };
  switch (String(interval).toLowerCase()) {
    case "year":
      ret.setFullYear(ret.getFullYear() + units);
      checkRollover();
      break;
    case "quarter":
      ret.setMonth(ret.getMonth() + 3 * units);
      checkRollover();
      break;
    case "month":
      ret.setMonth(ret.getMonth() + units);
      checkRollover();
      break;
    case "week":
      ret.setDate(ret.getDate() + 7 * units);
      break;
    case "day":
      ret.setDate(ret.getDate() + units);
      break;
    case "hour":
      ret.setTime(ret.getTime() + units * 3600000);
      break;
    case "minute":
      ret.setTime(ret.getTime() + units * 60000);
      break;
    case "second":
      ret.setTime(ret.getTime() + units * 1000);
      break;
    default:
      (ret as any) = undefined;
      break;
  }
  return ret;
}

export async function fetchFlag<T>({
  userId,
  apiKey,
  projectKey,
  environmentKey,
  flagKey,
  defaultValue,
  useCache,
  cacheDuration,
}: FetchFlagArgs<T>): Promise<T | undefined> {
  const isUsingCache = (useCache ?? true) && window.sessionStorage;
  const key = `projects/${projectKey}/environments/${environmentKey}/flags/${flagKey}`;
  if (isUsingCache) {
    const isCached = window.sessionStorage.getItem(`@firstkind/${key}`);
    if (isCached !== null) {
      const payload: CachedValue = JSON.parse(isCached);
      if (new Date() < new Date(payload.expires_at)) {
        return payload.value?.[flagKey] ?? defaultValue;
      }
    }
  }

  const resp = await fetch(`http://api.firstkindsoftware.com/v1/${key}`, {
    headers: {
      Accept: "application/json",
      "API-KEY": apiKey,
      "USER-ID": userId ?? "",
    },
  });
  if (resp.status === 404) {
    return defaultValue;
  }
  const payload = await resp.json();

  if (isUsingCache) {
    const isDurationDefined =
      cacheDuration?.interval !== undefined &&
      cacheDuration?.duration !== undefined;
    let tmp = { ...cacheDuration } as { interval: Interval; duration: number };
    if (!isDurationDefined) {
      tmp = {
        interval: "second",
        duration: 60,
      };
    }
    const expires_at = dateAdd(
      new Date(),
      tmp.interval,
      tmp.duration
    )?.toISOString();

    window.sessionStorage.setItem(
      `@firstkind/${key}`,
      JSON.stringify({
        expires_at,
        value: payload,
      } as CachedValue)
    );
  }

  return payload?.[flagKey] ?? defaultValue;
}

export async function fetchFlags<T>({
  userId,
  apiKey,
  projectKey,
  environmentKey,
  flagKeys,
  defaultValue,
  useCache,
  cacheDuration,
  resolveRemotely,
}: FetchFlagsArgs<T>): Promise<{ [key: string]: any } | undefined> {
  if (resolveRemotely) {
    return await fetchFlagsRemotely({
      userId,
      apiKey,
      projectKey,
      environmentKey,
      flagKeys,
      defaultValue,
    });
  }
  const results = await Promise.all(
    flagKeys.map((flagKey) =>
      fetchFlag({
        userId,
        apiKey,
        projectKey,
        environmentKey,
        flagKey,
        defaultValue,
        useCache,
        cacheDuration,
      })
    )
  );

  return zip(flagKeys, results).reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc;
  }, {} as any);
}

async function fetchFlagsRemotely({
  userId,
  apiKey,
  projectKey,
  environmentKey,
  flagKeys,
  defaultValue,
}: FetchFlagsRemotelyArgs): Promise<{ [key: string]: any } | undefined> {
  const key = `projects/${projectKey}/environments/${environmentKey}/flags/${flagKeys.join(
    ","
  )}`;
  const resp = await fetch(`http://api.firstkindsoftware.com/v1/${key}`, {
    headers: {
      Accept: "application/json",
      "API-KEY": apiKey,
      "USER-ID": userId ?? "",
    },
  });
  if (resp.status === 404) {
    return defaultValue;
  }
  const payload = await resp.json();

  return payload ?? defaultValue;
}
