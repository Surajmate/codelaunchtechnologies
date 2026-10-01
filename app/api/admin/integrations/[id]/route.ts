import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import {
  decryptSecret,
  encryptSecret,
} from "@/lib/integrationCrypto";

import Integration from "@/models/Integration";
import IntegrationLog from "@/models/IntegrationLog";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ======================================================
 * HELPERS
 * ======================================================
 */

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : "Unknown error";
}

function escapeRegex(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
 * Remove secret from API responses.
 */
function sanitizeIntegration(
  integration: any
) {
  if (!integration) {
    return null;
  }

  const {
    secret,
    ...safeIntegration
  } = integration;

  return safeIntegration;
}

/*
 * ======================================================
 * GET
 * ======================================================
 *
 * GET /api/admin/integrations/[id]
 *
 * Returns one integration.
 *
 * Secret is NEVER returned.
 *
 * ======================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN INTEGRATION DETAIL] GET started"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ------------------------------------------------------
     * ID
     * ------------------------------------------------------
     */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * FIND
     * ------------------------------------------------------
     */

    const integration =
      await Integration.findById(
        id
      ).lean();

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      integration:
        sanitizeIntegration(
          integration
        ),

      hasSecret:
        Boolean(
          integration.secret
        ),
    });
  } catch (error) {
    console.error(
      "[ADMIN INTEGRATION DETAIL] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load integration",

        error:
          process.env.NODE_ENV ===
          "development"
            ? getErrorMessage(
                error
              )
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ======================================================
 * PATCH
 * ======================================================
 *
 * PATCH /api/admin/integrations/[id]
 *
 * Updates:
 *
 * - name
 * - provider
 * - category
 * - baseUrl
 * - description
 * - status
 * - config
 * - secret
 *
 * ======================================================
 */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN INTEGRATION DETAIL] PATCH started"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ------------------------------------------------------
     * ID
     * ------------------------------------------------------
     */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * REQUEST BODY
     * ------------------------------------------------------
     */

    let body: any;

    try {
      body =
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
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * FIND CURRENT INTEGRATION
     * ------------------------------------------------------
     */

    const existing =
      await Integration.findById(
        id
      );

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * UPDATE OBJECT
     * ------------------------------------------------------
     */

    const update: Record<
      string,
      unknown
    > = {};

    /*
     * ------------------------------------------------------
     * NAME
     * ------------------------------------------------------
 */

    if (
      body.name !==
      undefined
    ) {
      const name =
        String(
          body.name
        ).trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Integration name cannot be empty",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Duplicate name check
       */

      const duplicate =
        await Integration.findOne({
          _id: {
            $ne: id,
          },

          name: {
            $regex:
              `^${escapeRegex(
                name
              )}$`,

            $options: "i",
          },
        })
          .select("_id")
          .lean();

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another integration with this name already exists",
          },
          {
            status: 409,
          }
        );
      }

      update.name =
        name;
    }

    /*
     * ------------------------------------------------------
     * PROVIDER
     * ------------------------------------------------------
     */

    if (
      body.provider !==
      undefined
    ) {
      const provider =
        String(
          body.provider
        ).trim();

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Provider cannot be empty",
          },
          {
            status: 400,
          }
        );
      }

      update.provider =
        provider;
    }

    /*
     * ------------------------------------------------------
     * CATEGORY
     * ------------------------------------------------------
     */

    if (
      body.category !==
      undefined
    ) {
      const category =
        String(
          body.category
        ).trim();

      const allowedCategories = [
        "API",
        "DATABASE",
        "CRM",
        "ERP",
        "MARKETING",
        "COMMUNICATION",
        "CLOUD",
        "OTHER",
      ];

      if (
        !allowedCategories.includes(
          category
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid integration category",
          },
          {
            status: 400,
          }
        );
      }

      update.category =
        category;
    }

    /*
     * ------------------------------------------------------
     * BASE URL
     * ------------------------------------------------------
     */

    if (
      body.baseUrl !==
      undefined
    ) {
      const baseUrl =
        String(
          body.baseUrl ||
            ""
        ).trim();

      if (baseUrl) {
        try {
          new URL(
            baseUrl
          );
        } catch {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid base URL",
            },
            {
              status: 400,
            }
          );
        }
      }

      update.baseUrl =
        baseUrl;
    }

    /*
     * ------------------------------------------------------
     * DESCRIPTION
     * ------------------------------------------------------
     */

    if (
      body.description !==
      undefined
    ) {
      update.description =
        String(
          body.description ||
            ""
        ).trim();
    }

    /*
     * ------------------------------------------------------
     * STATUS
     * ------------------------------------------------------
     */

    if (
      body.status !==
      undefined
    ) {
      const status =
        String(
          body.status
        ).trim();

      const allowedStatuses = [
        "ACTIVE",
        "INACTIVE",
        "ERROR",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid integration status",
          },
          {
            status: 400,
          }
        );
      }

      update.status =
        status;

      if (
        status === "ACTIVE"
      ) {
        update.lastError =
          null;
      }
    }

    /*
     * ------------------------------------------------------
     * CONFIG
     * ------------------------------------------------------
     */

    if (
      body.config !==
      undefined
    ) {
      if (
        body.config ===
          null ||
        typeof body.config !==
          "object" ||
        Array.isArray(
          body.config
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Config must be an object",
          },
          {
            status: 400,
          }
        );
      }

      update.config =
        body.config;
    }

    /*
     * ------------------------------------------------------
     * SECRET
     * ------------------------------------------------------
     *
     * Only replace the secret if a
     * new secret is provided.
     *
     * ------------------------------------------------------
     */

    if (
      body.secret !==
      undefined
    ) {
      const secret =
        String(
          body.secret ||
            ""
        );

      if (secret) {
        update.secret =
          encryptSecret(
            secret
          );
      }
    }

    /*
     * ------------------------------------------------------
     * UPDATED BY
     * ------------------------------------------------------
     */

    update.updatedBy =
      auth.user.id;

    /*
     * ------------------------------------------------------
     * SAVE
     * ------------------------------------------------------
 */

    const updated =
      await Integration.findByIdAndUpdate(
        id,
        {
          $set: update,
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to update integration",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * CREATE UPDATE LOG
     * ------------------------------------------------------
     */

    try {
      await IntegrationLog.create(
        {
          integration:
            updated._id,

          action:
            "UPDATE",

          result:
            "SUCCESS",

          message:
            "Integration updated successfully",

          performedBy:
            auth.user.id,
        }
      );
    } catch (logError) {
      console.error(
        "[ADMIN INTEGRATION DETAIL] UPDATE LOG ERROR:",
        logError
      );
    }

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
 */

    console.log(
      "[ADMIN INTEGRATION DETAIL] Updated:",
      String(
        updated._id
      )
    );

    return NextResponse.json({
      success: true,

      message:
        "Integration updated successfully",

      integration:
        sanitizeIntegration(
          updated
        ),

      hasSecret:
        Boolean(
          updated.secret
        ),
    });
  } catch (error) {
    console.error(
      "[ADMIN INTEGRATION DETAIL] PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update integration",

        error:
          process.env.NODE_ENV ===
          "development"
            ? getErrorMessage(
                error
              )
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ======================================================
 * DELETE
 * ======================================================
 *
 * DELETE /api/admin/integrations/[id]
 *
 * Only SUPER_ADMIN can delete.
 *
 * ======================================================
 */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN INTEGRATION DETAIL] DELETE started"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ------------------------------------------------------
     * SUPER ADMIN
     * ------------------------------------------------------
 */

    if (
      auth.user.role !==
      "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only SUPER_ADMIN can delete integrations",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * ID
     * ------------------------------------------------------
 */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
 */

    await connectDB();

    /*
     * ------------------------------------------------------
     * FIND BEFORE DELETE
     * ------------------------------------------------------
 */

    const integration =
      await Integration.findById(
        id
      ).lean();

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * DELETE
     * ------------------------------------------------------
 */

    const deleted =
      await Integration.findByIdAndDelete(
        id
      ).lean();

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * DELETE LOG
     * ------------------------------------------------------
     *
     * The integration itself is deleted,
     * therefore the log cannot reference
     * a deleted integration reliably.
     *
     * We intentionally don't create a
     * IntegrationLog here.
     *
     * ------------------------------------------------------
     */

    console.log(
      "[ADMIN INTEGRATION DETAIL] Deleted:",
      id
    );

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
 */

    return NextResponse.json({
      success: true,

      message:
        "Integration deleted successfully",
    });
  } catch (error) {
    console.error(
      "[ADMIN INTEGRATION DETAIL] DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to delete integration",

        error:
          process.env.NODE_ENV ===
          "development"
            ? getErrorMessage(
                error
              )
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ======================================================
 * POST - TEST CONNECTION
 * ======================================================
 *
 * POST /api/admin/integrations/[id]
 *
 * This endpoint:
 *
 * 1. Loads integration
 * 2. Reads test configuration
 * 3. Decrypts secret
 * 4. Builds HTTP request
 * 5. Executes request
 * 6. Updates integration status
 * 7. Creates IntegrationLog
 *
 * Supported:
 *
 * HTTP methods:
 *
 * GET
 * POST
 * PUT
 * PATCH
 * DELETE
 *
 * Body types:
 *
 * none
 * json
 * form
 * raw
 *
 * Authentication:
 *
 * none
 * bearer
 * header
 * basic
 * form
 *
 * ======================================================
 */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN INTEGRATION TEST] Starting"
    );

    /*
     * ------------------------------------------------------
     * AUTHENTICATION
     * ------------------------------------------------------
 */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ------------------------------------------------------
     * ID
     * ------------------------------------------------------
 */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
 */

    await connectDB();

    /*
     * ------------------------------------------------------
     * LOAD INTEGRATION
     * ------------------------------------------------------
 */

    const integration =
      await Integration.findById(
        id
      );

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * BASE URL
     * ------------------------------------------------------
 */

    if (
      !integration.baseUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration does not have a base URL",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * CONFIG
     * ------------------------------------------------------
 */

    const config =
      integration.config &&
      typeof integration.config ===
        "object" &&
      !Array.isArray(
        integration.config
      )
        ? (
            integration.config as Record<
              string,
              any
            >
          )
        : {};

    /*
     * ------------------------------------------------------
     * HTTP METHOD
     * ------------------------------------------------------
 */

    let method =
      String(
        config.testMethod ||
          ""
      )
        .trim()
        .toUpperCase();

    /*
     * Automatically use POST for
     * token URLs if no method is
     * configured.
     */

    if (!method) {
      if (
        integration.baseUrl
          .toLowerCase()
          .includes("/token")
      ) {
        method = "POST";
      } else {
        method = "GET";
      }
    }

    const allowedMethods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
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
            `Unsupported test method: ${method}`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * TEST URL
     * ------------------------------------------------------
 */

    let testUrl =
      String(
        integration.baseUrl
      ).trim();

    const testPath =
      String(
        config.testPath ||
          ""
      ).trim();

    if (testPath) {
      try {
        testUrl =
          new URL(
            testPath,
            testUrl
          ).toString();
      } catch {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid test path",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * ------------------------------------------------------
     * HEADERS
     * ------------------------------------------------------
 */

    const headers: Record<
      string,
      string
    > = {
      Accept:
        "application/json",
    };

    /*
     * ------------------------------------------------------
     * CUSTOM HEADERS
     * ------------------------------------------------------
 */

    if (
      config.testHeaders &&
      typeof config.testHeaders ===
        "object" &&
      !Array.isArray(
        config.testHeaders
      )
    ) {
      for (const [
        key,
        value,
      ] of Object.entries(
        config.testHeaders
      )) {
        if (
          value !== null &&
          value !== undefined
        ) {
          headers[
            String(key)
          ] = String(value);
        }
      }
    }

    /*
     * ------------------------------------------------------
     * DECRYPT SECRET
     * ------------------------------------------------------
 */

    let decryptedSecret =
      "";

    if (
      integration.secret
    ) {
      try {
        decryptedSecret =
          decryptSecret(
            integration.secret
          );
      } catch (error) {
        console.error(
          "[ADMIN INTEGRATION TEST] Secret decrypt failed:",
          getErrorMessage(
            error
          )
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to decrypt integration secret",
          },
          {
            status: 500,
          }
        );
      }
    }

    /*
     * ------------------------------------------------------
     * SECRET MODE
     * ------------------------------------------------------
 *
     * Supported:
     *
     * none
     * bearer
     * header
     * basic
     * form
     *
     * ------------------------------------------------------
 */

    const secretMode =
      String(
        config.secretMode ||
          "bearer"
      )
        .trim()
        .toLowerCase();

    /*
     * ------------------------------------------------------
     * BODY CONFIG
     * ------------------------------------------------------
 */

    let bodyConfig: Record<
      string,
      any
    > = {};

    if (
      config.testBody &&
      typeof config.testBody ===
        "object" &&
      !Array.isArray(
        config.testBody
      )
    ) {
      bodyConfig = {
        ...config.testBody,
      };
    }

    /*
     * ------------------------------------------------------
     * BEARER AUTH
     * ------------------------------------------------------
 */

    if (
      decryptedSecret &&
      secretMode ===
        "bearer"
    ) {
      headers[
        "Authorization"
      ] =
        `Bearer ${decryptedSecret}`;
    }

    /*
     * ------------------------------------------------------
     * HEADER AUTH
     * ------------------------------------------------------
     *
     * Example:
     *
     * secretMode:
     * header
     *
     * secretHeader:
     * client_secret
     *
     * ------------------------------------------------------
 */

    if (
      decryptedSecret &&
      secretMode ===
        "header"
    ) {
      const secretHeader =
        String(
          config.secretHeader ||
            "x-api-key"
        ).trim();

      if (!secretHeader) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Secret header is required",
          },
          {
            status: 400,
          }
        );
      }

      headers[
        secretHeader
      ] =
        decryptedSecret;
    }

    /*
     * ------------------------------------------------------
     * BASIC AUTH
     * ------------------------------------------------------
 */

    if (
      decryptedSecret &&
      secretMode ===
        "basic"
    ) {
      const username =
        String(
          config.username ||
            ""
        ).trim();

      if (!username) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Username is required for basic authentication",
          },
          {
            status: 400,
          }
        );
      }

      const credentials =
        Buffer.from(
          `${username}:${decryptedSecret}`
        ).toString(
          "base64"
        );

      headers[
        "Authorization"
      ] =
        `Basic ${credentials}`;
    }

    /*
     * ------------------------------------------------------
     * FORM SECRET
     * ------------------------------------------------------
     *
     * This supports APIs where the
     * secret belongs inside the form body.
     *
     * ------------------------------------------------------
 */

    if (
      decryptedSecret &&
      secretMode ===
        "form"
    ) {
      const secretField =
        String(
          config.secretField ||
            "client_secret"
        ).trim();

      if (!secretField) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Secret field is required for form authentication",
          },
          {
            status: 400,
          }
        );
      }

      bodyConfig[
        secretField
      ] =
        decryptedSecret;
    }

    /*
     * ------------------------------------------------------
     * NONE
     * ------------------------------------------------------
 */

    if (
      secretMode ===
      "none"
    ) {
      delete headers[
        "Authorization"
      ];
    }

    /*
     * ------------------------------------------------------
     * REQUEST BODY
     * ------------------------------------------------------
 */

    let body:
      | string
      | undefined;

    if (
      method !== "GET" &&
      method !== "DELETE"
    ) {
      const bodyType =
        String(
          config.testBodyType ||
            "json"
        )
          .trim()
          .toLowerCase();

      /*
       * ----------------------------------------------------
       * NONE
       * ----------------------------------------------------
       */

      if (
        bodyType ===
        "none"
      ) {
        body =
          undefined;
      }

      /*
       * ----------------------------------------------------
       * JSON
       * ----------------------------------------------------
       */

      else if (
        bodyType ===
        "json"
      ) {
        headers[
          "Content-Type"
        ] =
          "application/json";

        body =
          JSON.stringify(
            bodyConfig
          );
      }

      /*
       * ----------------------------------------------------
       * FORM
       * ----------------------------------------------------
       */

      else if (
        bodyType ===
        "form"
      ) {
        headers[
          "Content-Type"
        ] =
          "application/x-www-form-urlencoded";

        const form =
          new URLSearchParams();

        for (const [
          key,
          value,
        ] of Object.entries(
          bodyConfig
        )) {
          if (
            value !== null &&
            value !== undefined
          ) {
            form.set(
              String(key),
              String(value)
            );
          }
        }

        body =
          form.toString();
      }

      /*
       * ----------------------------------------------------
       * RAW
       * ----------------------------------------------------
       */

      else if (
        bodyType ===
        "raw"
      ) {
        headers[
          "Content-Type"
        ] =
          String(
            config.testContentType ||
              "text/plain"
          );

        if (
          typeof config.testBody ===
          "string"
        ) {
          body =
            config.testBody;
        } else {
          body =
            JSON.stringify(
              config.testBody ||
                ""
            );
        }
      }

      /*
       * ----------------------------------------------------
       * INVALID BODY TYPE
       * ----------------------------------------------------
       */

      else {
        return NextResponse.json(
          {
            success: false,
            message:
              `Unsupported test body type: ${bodyType}`,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * ------------------------------------------------------
     * TIMEOUT
     * ------------------------------------------------------
 */

    const timeout =
      Number(
        config.timeout ||
          15000
      );

    const safeTimeout =
      Number.isFinite(
        timeout
      ) &&
      timeout >= 1000 &&
      timeout <= 60000
        ? timeout
        : 15000;

    /*
     * ------------------------------------------------------
     * LOG REQUEST WITHOUT SECRETS
     * ------------------------------------------------------
 */

    console.log(
      "[ADMIN INTEGRATION TEST] Request:",
      {
        integrationId:
          id,

        method,

        url:
          testUrl,

        bodyType:
          config.testBodyType ||
          "none",

        secretMode,
      }
    );

    /*
     * ------------------------------------------------------
     * EXECUTE REQUEST
     * ------------------------------------------------------
 */

    const startedAt =
      Date.now();

    let response:
      | Response
      | null = null;

    let networkError =
      "";

    try {
      response =
        await fetch(
          testUrl,
          {
            method,

            headers,

            body,

            cache:
              "no-store",

            redirect:
              "follow",

            signal:
              AbortSignal.timeout(
                safeTimeout
              ),
          }
        );
    } catch (error) {
      networkError =
        getErrorMessage(
          error
        );
    }

    const responseTime =
      Date.now() -
      startedAt;

    /*
     * ------------------------------------------------------
     * NETWORK ERROR
     * ------------------------------------------------------
 */

    if (!response) {
      const message =
        "Unable to connect to integration";

      /*
       * Update integration
       */

      await Integration.findByIdAndUpdate(
        id,
        {
          $set: {
            status:
              "ERROR",

            lastCheckedAt:
              new Date(),

            lastError:
              networkError ||
              "Connection failed",

            updatedBy:
              auth.user.id,
          },
        }
      );

      /*
       * Create log
       */

      try {
        await IntegrationLog.create(
          {
            integration:
              integration._id,

            action:
              "TEST",

            result:
              "ERROR",

            method,

            statusCode:
              null,

            responseTime,

            message,

            responsePreview:
              networkError ||
              "Connection failed",

            error:
              networkError ||
              "Connection failed",

            performedBy:
              auth.user.id,
          }
        );
      } catch (logError) {
        console.error(
          "[ADMIN INTEGRATION TEST] Failed to create network log:",
          logError
        );
      }

      /*
       * Response
       */

      return NextResponse.json({
        success: true,

        connected: false,

        message,

        method,

        status:
          null,

        responseTime,

        responsePreview:
          networkError ||
          "Connection failed",
      });
    }

    /*
     * ------------------------------------------------------
     * RESPONSE BODY
     * ------------------------------------------------------
 */

    let responseText =
      "";

    try {
      responseText =
        await response.text();
    } catch (error) {
      console.warn(
        "[ADMIN INTEGRATION TEST] Unable to read response:",
        getErrorMessage(
          error
        )
      );
    }

    /*
     * Limit response preview.
     */

    const responsePreview =
      responseText
        .slice(
          0,
          1000
        )
        .replace(
          /[\r\n]+/g,
          " "
        );

    /*
     * ------------------------------------------------------
     * HTTP STATUS
     * ------------------------------------------------------
 */

    const responseStatus =
      response.status;

    /*
     * ------------------------------------------------------
     * CONNECTION RESULT
     * ------------------------------------------------------
 *
     * 2xx / 3xx:
     *
     * Successful
     *
     * 4xx / 5xx:
     *
     * Remote API reached but rejected
     * the request.
     *
     * ------------------------------------------------------
 */

    const connected =
      responseStatus >= 200 &&
      responseStatus < 400;

    /*
     * ------------------------------------------------------
     * ERROR MESSAGE
     * ------------------------------------------------------
 */

    let lastError:
      | string
      | null = null;

    if (!connected) {
      lastError =
        `HTTP ${responseStatus}`;

      if (
        responsePreview
      ) {
        lastError +=
          ` - ${responsePreview.slice(
            0,
            500
          )}`;
      }
    }

    /*
     * ------------------------------------------------------
     * RESULT MESSAGE
     * ------------------------------------------------------
 */

    const message =
      connected
        ? "Integration connection successful"
        : "Integration is reachable but returned an error";

    /*
     * ------------------------------------------------------
     * UPDATE INTEGRATION
     * ------------------------------------------------------
 */

    await Integration.findByIdAndUpdate(
      id,
      {
        $set: {
          status:
            connected
              ? "ACTIVE"
              : "ERROR",

          lastCheckedAt:
            new Date(),

          lastError,

          updatedBy:
            auth.user.id,
        },
      }
    );

    /*
     * ------------------------------------------------------
     * CREATE TEST LOG
     * ------------------------------------------------------
 *
     * NEVER store:
     *
     * - client_secret
     * - Authorization
     * - request headers
     * - request body
     * - decrypted secret
     *
     * ------------------------------------------------------
 */

    try {
      await IntegrationLog.create(
        {
          integration:
            integration._id,

          action:
            "TEST",

          result:
            connected
              ? "SUCCESS"
              : "ERROR",

          method,

          statusCode:
            responseStatus,

          responseTime,

          message,

          responsePreview,

          error:
            connected
              ? ""
              : lastError ||
                `HTTP ${responseStatus}`,

          performedBy:
            auth.user.id,
        }
      );

      console.log(
        "[ADMIN INTEGRATION TEST] Log created"
      );
    } catch (logError) {
      /*
       * Logging failure must NOT
       * cause a successful test
       * to fail.
       */

      console.error(
        "[ADMIN INTEGRATION TEST] Failed to create log:",
        logError
      );
    }

    /*
     * ------------------------------------------------------
     * SERVER LOG
     * ------------------------------------------------------
 */

    console.log(
      "[ADMIN INTEGRATION TEST] Result:",
      {
        id,

        method,

        status:
          responseStatus,

        connected,

        responseTime,
      }
    );

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
 */

    return NextResponse.json({
      success: true,

      connected,

      message,

      method,

      status:
        responseStatus,

      responseTime,

      responsePreview,
    });
  } catch (error) {
    console.error(
      "[ADMIN INTEGRATION TEST] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to test integration",

        error:
          process.env.NODE_ENV ===
          "development"
            ? getErrorMessage(
                error
              )
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}