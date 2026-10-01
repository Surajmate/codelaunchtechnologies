import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Certificate from "@/models/Certificate";
import Course from "@/models/Course";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type CertificateValidity =
  | "PERMANENT"
  | "LIMITED";

type CertificateStatus =
  | "ACTIVE"
  | "INACTIVE";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function cleanString(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function parseBoolean(
  value: unknown,
  defaultValue = false
): boolean {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value.trim().toLowerCase();

    if (
      normalized === "true" ||
      normalized === "1"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "0"
    ) {
      return false;
    }
  }

  return defaultValue;
}

function parseNumber(
  value: unknown,
  defaultValue: number
): number {
  if (
    value ===
      undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : defaultValue;
}

function isValidObjectId(
  value: unknown
): boolean {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(
      value
    )
  );
}

function isValidValidity(
  value: string
): value is CertificateValidity {
  return (
    value === "PERMANENT" ||
    value === "LIMITED"
  );
}

function isValidStatus(
  value: string
): value is CertificateStatus {
  return (
    value === "ACTIVE" ||
    value === "INACTIVE"
  );
}

/*
 * ============================================================
 * ADMIN AUTH
 * ============================================================
 */

async function requireAdmin() {
  const user =
    await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      status: 401,
      message:
        "Unauthorized.",
      user: null,
    };
  }

  const currentUser =
    user as any;

  const role =
    cleanString(
      currentUser?.role
    ).toUpperCase();

  const isAdmin =
    currentUser?.isAdmin ===
      true ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

  if (!isAdmin) {
    return {
      authorized: false,
      status: 403,
      message:
        "Forbidden. Admin access required.",
      user: null,
    };
  }

  return {
    authorized: true,
    status: 200,
    message: "",
    user,
  };
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * GET /api/admin/certificates
 *
 * Supports:
 *
 * ?page=1
 * ?limit=20
 * ?search=mern
 * ?status=ACTIVE
 * ?validity=LIMITED
 * ?course=<courseId>
 *
 * ============================================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireAdmin();

    if (
      !auth.authorized
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    await connectDB();

    const params =
      request.nextUrl.searchParams;

    const pageRaw =
      Number(
        params.get("page") ||
          "1"
      );

    const limitRaw =
      Number(
        params.get("limit") ||
          "20"
      );

    const page =
      Number.isFinite(
        pageRaw
      ) &&
      pageRaw > 0
        ? Math.floor(
            pageRaw
          )
        : 1;

    const limit =
      Number.isFinite(
        limitRaw
      ) &&
      limitRaw > 0
        ? Math.min(
            Math.floor(
              limitRaw
            ),
            100
          )
        : 20;

    const search =
      cleanString(
        params.get(
          "search"
        )
      );

    const status =
      cleanString(
        params.get(
          "status"
        )
      ).toUpperCase();

    const validity =
      cleanString(
        params.get(
          "validity"
        )
      ).toUpperCase();

    const courseId =
      cleanString(
        params.get(
          "course"
        )
      );

    const filter: Record<
      string,
      any
    > = {};

    /*
     * STATUS
     */

    if (
      status &&
      status !== "ALL"
    ) {
      if (
        isValidStatus(
          status
        )
      ) {
        filter.status =
          status;
      }
    }

    /*
     * VALIDITY
     */

    if (
      validity &&
      validity !== "ALL"
    ) {
      if (
        isValidValidity(
          validity
        )
      ) {
        filter.validity =
          validity;
      }
    }

    /*
     * COURSE
     */

    if (courseId) {
      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid course ID.",
          },
          {
            status: 400,
          }
        );
      }

      filter.course =
        new mongoose.Types.ObjectId(
          courseId
        );
    }

    /*
     * SEARCH
     */

    if (search) {
      const regex =
        new RegExp(
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        );

      filter.$or = [
        {
          title: regex,
        },
        {
          description:
            regex,
        },
        {
          issuer: regex,
        },
        {
          issuerName:
            regex,
        },
      ];
    }

    const skip =
      (page - 1) *
      limit;

    const [
      certificates,
      total,
    ] = await Promise.all([
      Certificate.find(
        filter
      )
        .populate({
          path: "course",
          select:
            "_id title slug status",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Certificate.countDocuments(
        filter
      ),
    ]);

    /*
     * STATS
     */

    const [
      active,
      inactive,
      permanent,
      limited,
    ] = await Promise.all([
      Certificate.countDocuments({
        ...filter,
        status:
          "ACTIVE",
      }),

      Certificate.countDocuments({
        ...filter,
        status:
          "INACTIVE",
      }),

      Certificate.countDocuments({
        ...filter,
        validity:
          "PERMANENT",
      }),

      Certificate.countDocuments({
        ...filter,
        validity:
          "LIMITED",
      }),
    ]);

    const normalized =
      certificates.map(
        (certificate: any) => ({
          ...certificate,

          _id: String(
            certificate._id
          ),

          course:
            certificate.course
              ? {
                  ...certificate.course,
                  _id: String(
                    certificate
                      .course
                      ._id
                  ),
                }
              : null,

          isActive:
            Boolean(
              certificate.isActive
            ),

          requirements:
            certificate.requirements ||
            {
              completionPercentage: 100,
              minimumScore: null,
              requireFinalAssessment:
                false,
            },
        })
      );

    const totalPages =
      Math.ceil(
        total / limit
      );

    return NextResponse.json({
      success: true,

      certificates:
        normalized,

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
        permanent,
        limited,
      },
    });
  } catch (error: any) {
    console.error(
      "[ADMIN CERTIFICATES][GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load certificates.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * POST
 * ============================================================
 *
 * POST /api/admin/certificates
 *
 * Creates a CERTIFICATE DEFINITION.
 *
 * This does NOT issue a certificate to a learner.
 *
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    console.log(
      "[ADMIN CERTIFICATES][POST] START"
    );

    /*
     * --------------------------------------------------------
     * AUTH
     * --------------------------------------------------------
     */

    const auth =
      await requireAdmin();

    if (
      !auth.authorized
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DATABASE
     * --------------------------------------------------------
     */

    await connectDB();

    /*
     * --------------------------------------------------------
     * BODY
     * --------------------------------------------------------
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
            "Invalid JSON request body.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "[ADMIN CERTIFICATES][POST] PAYLOAD:",
      body
    );

    /*
     * --------------------------------------------------------
     * TITLE
     * --------------------------------------------------------
     */

    const title =
      cleanString(
        body?.title
      );

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      title.length < 3
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate title must be at least 3 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      title.length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate title cannot exceed 200 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DESCRIPTION
     * --------------------------------------------------------
     */

    const description =
      cleanString(
        body?.description
      );

    if (
      description.length >
      2000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate description cannot exceed 2000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * COURSE
     * --------------------------------------------------------
     */

    const courseId =
      cleanString(
        body?.course
      );

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidObjectId(
        courseId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid course ID.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verify course exists.
     */

    const course =
      await Course.findById(
        courseId
      )
        .select(
          "_id title slug status isActive"
        )
        .lean();

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected course was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * ISSUER
     * --------------------------------------------------------
     */

    const issuer =
      cleanString(
        body?.issuer
      ) ||
      "Codelaunch Technologies";

    const issuerName =
      cleanString(
        body?.issuerName
      ) ||
      issuer;

    if (
      issuer.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Issuer must be at least 2 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      issuer.length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Issuer cannot exceed 200 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      issuerName.length >
      200
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Issuer name cannot exceed 200 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * ISSUER LOGO
     * --------------------------------------------------------
     */

    const issuerLogo =
      cleanString(
        body?.issuerLogo
      );

    if (
      issuerLogo.length >
      1000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Issuer logo URL cannot exceed 1000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * TEMPLATE
     * --------------------------------------------------------
     */

    const template =
      cleanString(
        body?.template
      ) ||
      "classic";

    const validTemplates = [
      "classic",
      "modern",
      "minimal",
      "corporate",
      "default",
    ];

    if (
      !validTemplates.includes(
        template
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid certificate template.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * VALIDITY
     * --------------------------------------------------------
     */

    const validity =
      cleanString(
        body?.validity
      ).toUpperCase() ||
      "PERMANENT";

    if (
      !isValidValidity(
        validity
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid certificate validity.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * VALIDITY DAYS
     * --------------------------------------------------------
     */

    let validityDays:
      | number
      | null =
      null;

    if (
      validity ===
      "LIMITED"
    ) {
      validityDays =
        parseNumber(
          body?.validityDays,
          0
        );

      if (
        !Number.isInteger(
          validityDays
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Validity days must be a whole number.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        validityDays < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Validity days must be at least 1 day.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        validityDays > 3650
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Validity cannot exceed 3650 days.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * --------------------------------------------------------
     * STATUS
     * --------------------------------------------------------
     */

    const status =
      cleanString(
        body?.status
      ).toUpperCase() ||
      "ACTIVE";

    if (
      !isValidStatus(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid certificate status.",
        },
        {
          status: 400,
        }
      );
    }

    const isActive =
      status ===
      "ACTIVE";

    /*
     * --------------------------------------------------------
     * REQUIREMENTS
     * --------------------------------------------------------
     */

    const rawRequirements =
      body?.requirements ||
      {};

    const completionPercentage =
      parseNumber(
        rawRequirements
          ?.completionPercentage,
        100
      );

    if (
      completionPercentage <
        0 ||
      completionPercentage >
        100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Completion percentage must be between 0 and 100.",
        },
        {
          status: 400,
        }
      );
    }

    const rawMinimumScore =
      rawRequirements
        ?.minimumScore;

    let minimumScore:
      | number
      | null =
      null;

    if (
      rawMinimumScore !==
        undefined &&
      rawMinimumScore !==
        null &&
      rawMinimumScore !==
        ""
    ) {
      minimumScore =
        parseNumber(
          rawMinimumScore,
          -1
        );

      if (
        minimumScore <
          0 ||
        minimumScore >
          100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Minimum score must be between 0 and 100.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const requireFinalAssessment =
      parseBoolean(
        rawRequirements
          ?.requireFinalAssessment,
        false
      );

    /*
     * --------------------------------------------------------
     * DUPLICATE CERTIFICATE
     * --------------------------------------------------------
     *
     * Prevent multiple active definitions with the same
     * title for the same course.
     *
     * --------------------------------------------------------
     */

    const duplicate =
      await Certificate.findOne({
        course:
          new mongoose.Types.ObjectId(
            courseId
          ),

        title,
      })
        .select(
          "_id title status"
        )
        .lean();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A certificate with this title already exists for this course.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * CREATE
     * --------------------------------------------------------
     */

    console.log(
      "[ADMIN CERTIFICATES][POST] Creating certificate..."
    );

    const certificate =
      await Certificate.create({
        title,

        description,

        course:
          new mongoose.Types.ObjectId(
            courseId
          ),

        issuer,

        issuerName,

        issuerLogo,

        template,

        validity,

        validityDays:
          validity ===
          "LIMITED"
            ? validityDays
            : null,

        status,

        isActive,

        requirements: {
          completionPercentage,

          minimumScore,

          requireFinalAssessment,
        },
      });

    console.log(
      "[ADMIN CERTIFICATES][POST] CREATED:",
      String(
        certificate._id
      )
    );

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    const result =
      certificate.toObject();

    return NextResponse.json(
      {
        success: true,

        message:
          "Certificate created successfully.",

        certificate: {
          ...result,

          _id: String(
            certificate._id
          ),

          course: {
            _id: String(
              course._id
            ),

            title:
              course.title,

            slug:
              course.slug,

            status:
              course.status,
          },
        },
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "============================================================"
    );

    console.error(
      "[ADMIN CERTIFICATES][POST] ERROR"
    );

    console.error(
      "============================================================"
    );

    console.error(
      error
    );

    /*
     * MONGOOSE VALIDATION
     */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const errors: Record<
        string,
        string
      > = {};

      for (
        const [
          field,
          fieldError,
        ] of Object.entries(
          error.errors ||
            {}
        )
      ) {
        errors[field] =
          (fieldError as any)
            ?.message ||
          "Invalid value.";
      }

      return NextResponse.json(
        {
          success: false,

          message:
            "Certificate validation failed.",

          errors,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * DUPLICATE KEY
     */

    if (
      error?.code ===
      11000
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "A certificate with the same unique information already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * CAST ERROR
     */

    if (
      error?.name ===
      "CastError"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Invalid ${error.path || "certificate"} value.`,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          process.env.NODE_ENV ===
          "development"
            ? error?.message ||
              "Unable to create certificate."
            : "Unable to create certificate.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? {
                name:
                  error?.name,

                message:
                  error?.message,

                code:
                  error?.code,
              }
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}