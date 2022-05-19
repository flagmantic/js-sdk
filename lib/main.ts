interface FetchFlagArgs<T> {
  userId?: string;
  apiKey: string;
  projectKey: string;
  environmentKey: string;
  flagKey: string;
  defaultValue?: T;
  useCache?: boolean;
}

export async function fetchFlag<T>({
  userId,
  apiKey,
  projectKey,
  environmentKey,
  flagKey,
  defaultValue,
  useCache
}: FetchFlagArgs<T>): Promise<T | undefined> {
  const isUsingCache = (useCache ?? true) && window.sessionStorage;

  const key = `projects/${projectKey}/environments/${environmentKey}/flags/${flagKey}`;
  if (isUsingCache) {
    const isCached = window.sessionStorage.getItem(`@firstkind/${key}`);
    if (isCached !== null) {
        const payload = JSON.parse(isCached);
        return payload?.[flagKey] ?? defaultValue;
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
    window.sessionStorage.setItem(`@firstkind/${key}`, JSON.stringify(payload));
  }

  return payload?.[flagKey] ?? defaultValue;
}
