import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

interface QueryParam {
  key?: string;
  value?: string;
  enabled?: boolean;
}

interface Header {
  key?: string;
  value?: string;
  enabled?: boolean;
}

interface Authorization {
  type?: string;
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  addTo?: string;
}

interface ExecuteRequest {
  method?: string;
  url?: string;
  queryParams?: QueryParam[];
  headers?: Header[];
  authorization?: Authorization;
  body?: unknown;
  bodyType?: string;
  timeout?: number;
}

const MAX_TIMEOUT = 60000;
const DEFAULT_TIMEOUT = 30000;

function isValidUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function buildUrl(
  url: string,
  queryParams: QueryParam[] = []
) {
  const target = new URL(url);

  for (const parameter of queryParams) {
    if (
      parameter.enabled === false ||
      !parameter.key?.trim()
    ) {
      continue;
    }

    target.searchParams.append(
      parameter.key.trim(),
      parameter.value ?? ""
    );
  }

  return target.toString();
}

function buildHeaders(
  headers: Header[] = []
) {
  const result: Record<
    string,
    string
  > = {};

  for (const header of headers) {
    if (
      header.enabled === false ||
      !header.key?.trim()
    ) {
      continue;
    }

    result[
      header.key.trim()
    ] =
      header.value ?? "";
  }

  return result;
}

function applyAuthorization(
  headers: Record<string, string>,
  authorization?: Authorization
) {
  if (!authorization) {
    return;
  }

  const type =
    authorization.type?.toUpperCase() ||
    "NONE";

  /*
   * NONE
   */
  if (type === "NONE") {
    return;
  }

  /*
   * BEARER TOKEN
   */
  if (
    type === "BEARER" ||
    type === "BEARER_TOKEN"
  ) {
    const token =
      authorization.token?.trim();

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    return;
  }

  /*
   * BASIC AUTH
   */
  if (type === "BASIC") {
    const username =
      authorization.username ?? "";

    const password =
      authorization.password ?? "";

    const encoded = Buffer.from(
      `${username}:${password}`
    ).toString("base64");

    headers.Authorization =
      `Basic ${encoded}`;

    return;
  }

  /*
   * API KEY
   */
  if (
    type === "API_KEY" ||
    type === "APIKEY"
  ) {
    const key =
      authorization.key?.trim();

    const value =
      authorization.value ?? "";

    if (!key) {
      return;
    }

    /*
     * Add API key to query string is handled
     * separately by the caller.
     *
     * Default behavior is HEADER.
     */
    headers[key] = value;

    return;
  }
}

function normalizeBody(
  body: unknown,
  bodyType?: string
) {
  if (
    body === undefined ||
    body === null ||
    body === ""
  ) {
    return undefined;
  }

  if (
    bodyType === "none"
  ) {
    return undefined;
  }

  if (
    typeof body === "string"
  ) {
    return body;
  }

  return JSON.stringify(body);
}

async function readResponseBody(
  response: Response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  const text =
    await response.text();

  if (!text) {
    return "";
  }

  /*
   * Prefer JSON parsing when the
   * response declares JSON.
   */
  if (
    contentType.includes(
      "application/json"
    ) ||
    contentType.includes(
      "+json"
    )
  ) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /*
   * Some APIs don't correctly send
   * their content-type. Try JSON anyway.
   */
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getResponseHeaders(
  response: Response
) {
  const result: Record<
    string,
    string
  > = {};

  response.headers.forEach(
    (value, key) => {
      result[key] = value;
    }
  );

  return result;
}

export async function POST(
  request: Request
) {
  const startedAt =
    Date.now();

  try {
    /*
     * ==========================================
     * AUTHENTICATION
     * ==========================================
     */
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ==========================================
     * REQUEST BODY
     * ==========================================
     */
    let data: ExecuteRequest;

    try {
      data =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * VALIDATE URL
     * ==========================================
     */
    const url =
      data.url?.trim();

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          message:
            "URL is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid HTTP or HTTPS URL",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * METHOD
     * ==========================================
     */
    const method =
      (
        data.method ||
        "GET"
      ).toUpperCase();

    const allowedMethods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ];

    if (
      !allowedMethods.includes(
        method
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `HTTP method ${method} is not supported`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * QUERY PARAMETERS
     * ==========================================
     */
    let targetUrl: string;

    try {
      targetUrl =
        buildUrl(
          url,
          data.queryParams || []
        );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to build request URL",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * HEADERS
     * ==========================================
     */
    const headers =
      buildHeaders(
        data.headers || []
      );

    /*
     * ==========================================
     * AUTHORIZATION
     * ==========================================
     */
    applyAuthorization(
      headers,
      data.authorization
    );

    /*
     * ==========================================
     * BODY
     * ==========================================
     */
    const requestBody =
      method === "GET" ||
      method === "HEAD" ||
      method === "OPTIONS"
        ? undefined
        : normalizeBody(
            data.body,
            data.bodyType
          );

    /*
     * Add JSON content type when
     * sending a JSON object/string.
     */
    if (
      requestBody !==
        undefined &&
      !Object.keys(
        headers
      ).some(
        (key) =>
          key.toLowerCase() ===
          "content-type"
      )
    ) {
      if (
        data.bodyType ===
          "json" ||
        typeof data.body ===
          "object"
      ) {
        headers[
          "Content-Type"
        ] =
          "application/json";
      }
    }

    /*
     * ==========================================
     * TIMEOUT
     * ==========================================
     */
    const requestedTimeout =
      Number(
        data.timeout
      );

    const timeout =
      Number.isFinite(
        requestedTimeout
      )
        ? Math.min(
            Math.max(
              requestedTimeout,
              1000
            ),
            MAX_TIMEOUT
          )
        : DEFAULT_TIMEOUT;

    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(
        () => {
          controller.abort();
        },
        timeout
      );

    /*
     * ==========================================
     * EXECUTE EXTERNAL API
     * ==========================================
     */
    let response: Response;

    try {
      response =
        await fetch(
          targetUrl,
          {
            method,

            headers,

            body: requestBody,

            signal:
              controller.signal,

            /*
             * Don't cache API tester
             * responses.
             */
            cache: "no-store",

            /*
             * Redirect behavior similar
             * to normal API clients.
             */
            redirect: "follow",
          }
        );
    } catch (error) {
      clearTimeout(
        timeoutId
      );

      const duration =
        Date.now() -
        startedAt;

      if (
        error instanceof
          Error &&
        error.name ===
          "AbortError"
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              `Request timed out after ${timeout} ms`,

            duration,
          },
          {
            status: 408,
          }
        );
      }

      return NextResponse.json(
        {
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to connect to target API",

          duration,
        },
        {
          status: 502,
        }
      );
    }

    clearTimeout(
      timeoutId
    );

    /*
     * ==========================================
     * RESPONSE
     * ==========================================
     */
    const duration =
      Date.now() -
      startedAt;

    const responseHeaders =
      getResponseHeaders(
        response
      );

    const responseBody =
      await readResponseBody(
        response
      );

    return NextResponse.json({
      success: true,

      status:
        response.status,

      statusText:
        response.statusText,

      duration,

      headers:
        responseHeaders,

      body:
        responseBody,

      url:
        targetUrl,

      method,
    });
  } catch (error) {
    console.error(
      "API Tester execution error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to execute API request",

        duration:
          Date.now() -
          startedAt,
      },
      {
        status: 500,
      }
    );
  }
}