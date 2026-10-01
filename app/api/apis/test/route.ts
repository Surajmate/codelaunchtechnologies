import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const requestData = await request.json();

    const {
      method = "GET",
      url,
      headers = {},
      body: requestBody,
    } = requestData;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          message: "Request URL is required",
        },
        { status: 400 }
      );
    }

    const normalizedMethod = method.toUpperCase();

    const targetUrl = new URL(url);

    /*
     * Headers supplied by API Tester
     */
    const outgoingHeaders: Record<string, string> = {
      ...(headers || {}),
    };

    /*
     * Forward authentication cookie ONLY
     * when testing the same application.
     *
     * This prevents accidentally exposing
     * the user's session cookie to external APIs.
     */
    const incomingHost =
      request.headers.get("host");

    const targetHost = targetUrl.host;

    const isSameOrigin =
      incomingHost === targetHost;

    if (isSameOrigin) {
      const cookie =
        request.headers.get("cookie");

      if (cookie) {
        outgoingHeaders.cookie = cookie;
      }
    }

    /*
     * Forward Content-Type automatically
     * when request body exists.
     */
    if (
      !["GET", "HEAD"].includes(
        normalizedMethod
      ) &&
      requestBody !== undefined &&
      requestBody !== null &&
      requestBody !== ""
    ) {
      if (!outgoingHeaders["Content-Type"]) {
        outgoingHeaders["Content-Type"] =
          "application/json";
      }
    }

    const fetchOptions: RequestInit = {
      method: normalizedMethod,

      headers: outgoingHeaders,

      redirect: "manual",
    };

    /*
     * Request body
     */
    if (
      !["GET", "HEAD"].includes(
        normalizedMethod
      ) &&
      requestBody !== undefined &&
      requestBody !== null &&
      requestBody !== ""
    ) {
      fetchOptions.body =
        typeof requestBody === "string"
          ? requestBody
          : JSON.stringify(requestBody);
    }

    /*
     * Execute target API
     */
    const response = await fetch(
      targetUrl.toString(),
      fetchOptions
    );

    const responseTime =
      Date.now() - startTime;

    /*
     * Response headers
     */
    const responseHeaders: Record<
      string,
      string
    > = {};

    response.headers.forEach(
      (value, key) => {
        responseHeaders[key] = value;
      }
    );

    /*
     * Response body
     */
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let responseData: unknown;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      try {
        responseData =
          await response.json();
      } catch {
        responseData = null;
      }
    } else {
      responseData =
        await response.text();
    }

    /*
     * IMPORTANT:
     *
     * Even if the target API returns
     * 400 / 401 / 404 / 500,
     * the API Tester request itself
     * succeeded.
     *
     * We return success:true and expose
     * the target status separately.
     */
    return NextResponse.json({
      success: true,

      response: {
        status: response.status,

        statusText:
          response.statusText,

        responseTime,

        headers:
          responseHeaders,

        data: responseData,
      },
    });
  } catch (error) {
    console.error(
      "API tester error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to execute request",

        responseTime:
          Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}