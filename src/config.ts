import { InBrowserApi } from "./api/in-browser/InBrowserApi";
import { PythonApi } from "./api/python/PythonApi";

const middleware = import.meta.env.VITE_MIDDLEWARE || "local";
const lmStudioUrl =
  import.meta.env.VITE_LM_STUDIO_URL || "http://localhost:1234/v1";
const pythonProxyUrl =
  import.meta.env.VITE_PYTHON_PROXY_URL || "http://localhost:8080";

export const server =
  middleware === "python"
    ? new PythonApi({
        lmStudioUrl,
        proxyUrl: pythonProxyUrl,
      })
    : new InBrowserApi({
        lmStudioUrl,
      });
