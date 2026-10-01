import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";
import { encryptSecret } from "@/lib/integrationCrypto";

import Integration from "@/models/Integration";

/*
 * ======================================================
 * GET
 * ======================================================
 *
 * GET /api/admin/integrations
 *
 * Supports:
 *
 * ?search=bajaj
 * ?status=ACTIVE
 * ?category=API
 * ?page=1
 * ?limit=20
 *
 * ======================================================
 */

export async function GET(
  request: Request
) {
  try {
    console.log(
      "[ADMIN INTEGRATIONS] GET started"
    );

    /*
     * ------------------------------------------------------
     * ADMIN AUTHENTICATION
     * ------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * QUERY PARAMETERS
     * ------------------------------------------------------
 */

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "ALL";

    const category =
      searchParams
        .get("category")
        ?.trim() || "ALL";

    const pageParam =
      Number(
        searchParams.get("page") ||
          "1"
      );

    const limitParam =
      Number(
        searchParams.get("limit") ||
          "20"
      );

    /*
     * ------------------------------------------------------
     * PAGINATION
     * ------------------------------------------------------
     */

    const page =
      Number.isFinite(
        pageParam
      ) && pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    const limit =
      Number.isFinite(
        limitParam
      ) &&
      limitParam > 0
        ? Math.min(
            Math.floor(
              limitParam
            ),
            100
          )
        : 20;

    const skip =
      (page - 1) * limit;

    /*
     * ------------------------------------------------------
     * FILTER
     * ------------------------------------------------------
     */

    const filter: Record<
      string,
      unknown
    > = {};

    /*
     * Search
     */

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },

        {
          provider: {
            $regex: search,
            $options: "i",
          },
        },

        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    /*
     * Status
     */

    if (
      [
        "ACTIVE",
        "INACTIVE",
        "ERROR",
      ].includes(status)
    ) {
      filter.status =
        status;
    }

    /*
     * Category
     */

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
      allowedCategories.includes(
        category
      )
    ) {
      filter.category =
        category;
    }

    /*
     * ------------------------------------------------------
     * LOAD DATA
     * ------------------------------------------------------
     *
     * IMPORTANT:
     *
     * We explicitly exclude "secret".
     */

    const [
      integrations,
      total,
      active,
      inactive,
      errors,
    ] =
      await Promise.all([
        Integration.find(filter)
          .select(
            "-secret"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Integration.countDocuments(
          filter
        ),

        Integration.countDocuments({
          status: "ACTIVE",
        }),

        Integration.countDocuments({
          status: "INACTIVE",
        }),

        Integration.countDocuments({
          status: "ERROR",
        }),
      ]);

    /*
     * ------------------------------------------------------
     * PAGINATION
     * ------------------------------------------------------
     */

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / limit
        )
      );

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      integrations,

      pagination: {
        page,

        limit,

        total,

        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },

      stats: {
        total,

        active,

        inactive,

        errors,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN INTEGRATIONS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load integrations",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
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
 * POST
 * ======================================================
 *
 * POST /api/admin/integrations
 *
 * Creates a new integration.
 *
 * ======================================================
 */

export async function POST(
  request: Request
) {
  try {
    console.log(
      "[ADMIN INTEGRATIONS] POST started"
    );

    /*
     * ------------------------------------------------------
     * ADMIN AUTHENTICATION
     * ------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ------------------------------------------------------
     * REQUEST BODY
     * ------------------------------------------------------
     */

    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    const provider =
      String(
        body.provider || ""
      ).trim();

    const category =
      String(
        body.category ||
          "API"
      ).trim();

    const baseUrl =
      String(
        body.baseUrl || ""
      ).trim();

    const description =
      String(
        body.description ||
          ""
      ).trim();

    const status =
      String(
        body.status ||
          "INACTIVE"
      ).trim();

    const secret =
      String(
        body.secret || ""
      );

    const config =
      body.config &&
      typeof body.config ===
        "object"
        ? body.config
        : {};

    /*
     * ------------------------------------------------------
     * VALIDATION
     * ------------------------------------------------------
     */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Integration name is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Provider is required",
        },
        {
          status: 400,
        }
      );
    }

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

    /*
     * ------------------------------------------------------
     * DATABASE
     * ------------------------------------------------------
     */

    await connectDB();

    /*
     * ------------------------------------------------------
     * CHECK DUPLICATE NAME
     * ------------------------------------------------------
     */

    const existing =
      await Integration.findOne({
        name: {
          $regex: `^${name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
      })
        .select("_id")
        .lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An integration with this name already exists",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ------------------------------------------------------
     * ENCRYPT SECRET
     * ------------------------------------------------------
     */

    let encryptedSecret =
      "";

    if (secret) {
      encryptedSecret =
        encryptSecret(
          secret
        );
    }

    /*
     * ------------------------------------------------------
     * CREATE
     * ------------------------------------------------------
     */

    const integration =
      await Integration.create({
        name,

        provider,

        category,

        baseUrl,

        description,

        status,

        config,

        secret:
          encryptedSecret,

        createdBy:
          auth.user.id,

        updatedBy:
          auth.user.id,
      });

    /*
     * ------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------
     */

    console.log(
      "[ADMIN INTEGRATIONS] Created:",
      String(
        integration._id
      )
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Integration created successfully",

        integration: {
          _id:
            integration._id,

          name:
            integration.name,

          provider:
            integration.provider,

          category:
            integration.category,

          baseUrl:
            integration.baseUrl,

          description:
            integration.description,

          status:
            integration.status,

          config:
            integration.config,

          lastCheckedAt:
            integration.lastCheckedAt,

          lastError:
            integration.lastError,

          createdAt:
            integration.createdAt,

          updatedAt:
            integration.updatedAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN INTEGRATIONS] POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to create integration",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}