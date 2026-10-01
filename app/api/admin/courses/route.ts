import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";
import User from "@/models/User";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type CourseStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type CourseLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "ALL_LEVELS";

type SortOption =
  | "newest"
  | "oldest"
  | "popular"
  | "rating";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function cleanString(
  value: unknown
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

/*
 * ------------------------------------------------------------
 * BOOLEAN
 * ------------------------------------------------------------
 */

function parseBoolean(
  value: unknown,
  defaultValue = false
): boolean {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      normalized ===
      "true"
    ) {
      return true;
    }

    if (
      normalized ===
      "false"
    ) {
      return false;
    }

    if (
      normalized === "1"
    ) {
      return true;
    }

    if (
      normalized === "0"
    ) {
      return false;
    }
  }

  return defaultValue;
}

/*
 * ------------------------------------------------------------
 * NUMBER
 * ------------------------------------------------------------
 */

function parseNumber(
  value: unknown,
  defaultValue = 0
): number {
  if (
    value ===
      null ||
    value ===
      undefined ||
    value === ""
  ) {
    return defaultValue;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : defaultValue;
}

/*
 * ------------------------------------------------------------
 * STRING ARRAY
 * ------------------------------------------------------------
 */

function cleanStringArray(
  value: unknown,
  maxItems = 100,
  maxItemLength = 500
): string[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    )
    .map(
      (item) =>
        item.trim()
    )
    .filter(
      (item) =>
        item.length > 0
    )
    .map(
      (item) =>
        item.substring(
          0,
          maxItemLength
        )
    )
    .slice(
      0,
      maxItems
    );
}

/*
 * ------------------------------------------------------------
 * SLUG
 * ------------------------------------------------------------
 */

function createSlug(
  value: string
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s-]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/*
 * ------------------------------------------------------------
 * STATUS
 * ------------------------------------------------------------
 */

function isValidStatus(
  value: string
): value is CourseStatus {
  return [
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
  ].includes(value);
}

/*
 * ------------------------------------------------------------
 * LEVEL
 * ------------------------------------------------------------
 */

function isValidLevel(
  value: string
): value is CourseLevel {
  return [
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED",
    "ALL_LEVELS",
  ].includes(value);
}

/*
 * ------------------------------------------------------------
 * SORT
 * ------------------------------------------------------------
 */

function isValidSort(
  value: string
): value is SortOption {
  return [
    "newest",
    "oldest",
    "popular",
    "rating",
  ].includes(value);
}

/*
 * ------------------------------------------------------------
 * REGEX ESCAPE
 * ------------------------------------------------------------
 */

function escapeRegex(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
 * ============================================================
 * ADMIN AUTHENTICATION
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
        "Unauthorized",
      user: null,
    };
  }

  const currentUser =
    user as typeof user & {
      role?: string;
      isAdmin?: boolean;
      _id?: string;
      id?: string;
    };

  const role =
    cleanString(
      currentUser.role
    ).toUpperCase();

  const isAdmin =
    currentUser.isAdmin ===
      true ||
    role === "ADMIN" ||
    role ===
      "SUPER_ADMIN";

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
 * GET /api/admin/courses
 * ============================================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    /*
     * --------------------------------------------------------
     * ADMIN AUTH
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
     * QUERY PARAMETERS
     * --------------------------------------------------------
     */

    const searchParams =
      request.nextUrl
        .searchParams;

    const pageParam =
      Number(
        searchParams.get(
          "page"
        ) || "1"
      );

    const limitParam =
      Number(
        searchParams.get(
          "limit"
        ) || "12"
      );

    const page =
      Number.isFinite(
        pageParam
      ) &&
      pageParam > 0
        ? Math.floor(
            pageParam
          )
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
            50
          )
        : 12;

    const search =
      cleanString(
        searchParams.get(
          "search"
        )
      );

    const statusParam =
      cleanString(
        searchParams.get(
          "status"
        )
      ).toUpperCase();

    const levelParam =
      cleanString(
        searchParams.get(
          "level"
        )
      ).toUpperCase();

    const featuredParam =
      searchParams.get(
        "featured"
      );

    const isFreeParam =
      searchParams.get(
        "isFree"
      );

    const sortParam =
      cleanString(
        searchParams.get(
          "sort"
        )
      ).toLowerCase();

    /*
     * --------------------------------------------------------
     * FILTER
     * --------------------------------------------------------
     */

    const filter: Record<
      string,
      any
    > = {};

    /*
     * STATUS
     */

    if (
      statusParam &&
      statusParam !==
        "ALL"
    ) {
      if (
        isValidStatus(
          statusParam
        )
      ) {
        filter.status =
          statusParam;
      }
    }

    /*
     * LEVEL
     */

    if (
      levelParam &&
      levelParam !==
        "ALL"
    ) {
      if (
        isValidLevel(
          levelParam
        )
      ) {
        filter.level =
          levelParam;
      }
    }

    /*
     * FEATURED
     */

    if (
      featuredParam ===
      "true"
    ) {
      filter.featured =
        true;
    }

    if (
      featuredParam ===
      "false"
    ) {
      filter.featured =
        false;
    }

    /*
     * FREE / PAID
     */

    if (
      isFreeParam ===
      "true"
    ) {
      filter.isFree =
        true;
    }

    if (
      isFreeParam ===
      "false"
    ) {
      filter.isFree =
        false;
    }

    /*
     * SEARCH
     */

    if (search) {
      const regex =
        new RegExp(
          escapeRegex(
            search
          ),
          "i"
        );

      filter.$or = [
        {
          title: regex,
        },
        {
          shortDescription:
            regex,
        },
        {
          description:
            regex,
        },
        {
          category:
            regex,
        },
        {
          subCategory:
            regex,
        },
        {
          instructorName:
            regex,
        },
        {
          tags: regex,
        },
      ];
    }

    /*
     * --------------------------------------------------------
     * SORT
     * --------------------------------------------------------
     */

    let sort:
      Record<
        string,
        1 | -1
      > = {
      createdAt: -1,
    };

    switch (
      sortParam
    ) {
      case "oldest":
        sort = {
          createdAt: 1,
        };
        break;

      case "popular":
        sort = {
          enrollmentCount:
            -1,
          createdAt: -1,
        };
        break;

      case "rating":
        sort = {
          "rating.average":
            -1,
          "rating.count":
            -1,
          createdAt: -1,
        };
        break;

      case "newest":
      default:
        sort = {
          createdAt: -1,
        };
        break;
    }

    /*
     * --------------------------------------------------------
     * PAGINATION
     * --------------------------------------------------------
     */

    const skip =
      (page - 1) *
      limit;

    /*
     * --------------------------------------------------------
     * COURSES + TOTAL
     * --------------------------------------------------------
     */

    const [
      courses,
      total,
    ] =
      await Promise.all([
        Course.find(
          filter
        )
          .populate({
            path:
              "instructor",
            select:
              "_id name email role",
          })
          .populate({
            path:
              "createdBy",
            select:
              "_id name email role",
          })
          .populate({
            path:
              "updatedBy",
            select:
              "_id name email role",
          })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),

        Course.countDocuments(
          filter
        ),
      ]);

    /*
     * --------------------------------------------------------
     * STATS
     * --------------------------------------------------------
     *
     * Global stats, independent of pagination.
     * Search/filter conditions except status are retained.
     * --------------------------------------------------------
     */

    const statsFilter: Record<
      string,
      any
    > = {};

    if (
      filter.$or
    ) {
      statsFilter.$or =
        filter.$or;
    }

    if (
      filter.level
    ) {
      statsFilter.level =
        filter.level;
    }

    if (
      filter.featured !==
      undefined
    ) {
      statsFilter.featured =
        filter.featured;
    }

    if (
      filter.isFree !==
      undefined
    ) {
      statsFilter.isFree =
        filter.isFree;
    }

    const [
      published,
      draft,
      archived,
      featured,
      free,
      paid,
    ] =
      await Promise.all([
        Course.countDocuments({
          ...statsFilter,
          status:
            "PUBLISHED",
        }),

        Course.countDocuments({
          ...statsFilter,
          status:
            "DRAFT",
        }),

        Course.countDocuments({
          ...statsFilter,
          status:
            "ARCHIVED",
        }),

        Course.countDocuments({
          ...statsFilter,
          featured: true,
        }),

        Course.countDocuments({
          ...statsFilter,
          isFree: true,
        }),

        Course.countDocuments({
          ...statsFilter,
          isFree: false,
        }),
      ]);

    /*
     * --------------------------------------------------------
     * NORMALIZE
     * --------------------------------------------------------
     */

    const normalizedCourses =
      courses.map(
        (course: any) => ({
          ...course,

          _id: String(
            course._id
          ),

          instructor:
            course.instructor
              ? {
                  ...course.instructor,
                  _id: String(
                    course
                      .instructor
                      ._id
                  ),
                }
              : null,

          createdBy:
            course.createdBy
              ? {
                  ...course.createdBy,
                  _id: String(
                    course
                      .createdBy
                      ._id
                  ),
                }
              : null,

          updatedBy:
            course.updatedBy
              ? {
                  ...course.updatedBy,
                  _id: String(
                    course
                      .updatedBy
                      ._id
                  ),
                }
              : null,

          price: Number(
            course.price ||
              0
          ),

          discountPrice:
            Number(
              course.discountPrice ||
                0
            ),

          durationMinutes:
            Number(
              course.durationMinutes ||
                0
            ),

          lessonCount:
            Number(
              course.lessonCount ||
                0
            ),

          moduleCount:
            Number(
              course.moduleCount ||
                0
            ),

          enrollmentCount:
            Number(
              course.enrollmentCount ||
                0
            ),

          completionCount:
            Number(
              course.completionCount ||
                0
            ),

          featured:
            Boolean(
              course.featured
            ),

          isFree:
            Boolean(
              course.isFree
            ),

          certificateEnabled:
            Boolean(
              course.certificateEnabled
            ),
        })
      );

    const totalPages =
      Math.ceil(
        total / limit
      );

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      courses:
        normalizedCourses,

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

        published,

        draft,

        archived,

        featured,

        free,

        paid,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN COURSES][GET] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load courses.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * POST /api/admin/courses
 * ============================================================
 *
 * CREATE COURSE
 *
 * ============================================================
 */

export async function POST(
  request: NextRequest
) {
  try {
    console.log(
      "[ADMIN COURSES][POST] Create course started"
    );

    /*
     * --------------------------------------------------------
     * ADMIN AUTH
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
     * AUTHENTICATED USER
     * --------------------------------------------------------
     */

    const currentUser =
      auth.user as any;

    const userId =
      currentUser?.id ||
      currentUser?._id;

    if (
      !userId
    ) {
      console.error(
        "[ADMIN COURSES][POST] No authenticated user ID"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to determine authenticated admin user.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        String(userId)
      )
    ) {
      console.error(
        "[ADMIN COURSES][POST] Invalid authenticated user ID:",
        userId
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Authenticated admin user ID is invalid.",
        },
        {
          status: 401,
        }
      );
    }

    const adminId =
      new mongoose.Types.ObjectId(
        String(userId)
      );

    /*
     * --------------------------------------------------------
     * REQUEST BODY
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
      "[ADMIN COURSES][POST] Payload:",
      body
    );

    /*
     * --------------------------------------------------------
     * BASIC INFORMATION
     * --------------------------------------------------------
     */

    const title =
      cleanString(
        body?.title
      );

    const shortDescription =
      cleanString(
        body?.shortDescription
      );

    const description =
      cleanString(
        body?.description
      );

    const category =
      cleanString(
        body?.category
      );

    const subCategory =
      cleanString(
        body?.subCategory
      );

    const language =
      cleanString(
        body?.language
      ) ||
      "English";

    /*
     * --------------------------------------------------------
     * TITLE VALIDATION
     * --------------------------------------------------------
     */

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course title is required.",
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
            "Course title must be at least 3 characters.",
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
            "Course title cannot exceed 200 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * SHORT DESCRIPTION
     * --------------------------------------------------------
     */

    if (
      shortDescription.length <
      10
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Short description must be at least 10 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      shortDescription.length >
      500
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Short description cannot exceed 500 characters.",
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

    if (
      description.length <
      20
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course description must be at least 20 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      description.length >
      20000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course description cannot exceed 20000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * CATEGORY
     * --------------------------------------------------------
     */

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course category is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      category.length >
      100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course category cannot exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * SLUG
     * --------------------------------------------------------
     */

    const requestedSlug =
      cleanString(
        body?.slug
      );

    const slug =
      createSlug(
        requestedSlug ||
          title
      );

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to generate a valid course slug.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      slug.length < 3
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course slug must be at least 3 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      slug.length > 200
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course slug cannot exceed 200 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DUPLICATE SLUG
     * --------------------------------------------------------
     */

    const existingCourse =
      await Course.findOne({
        slug,
      })
        .select(
          "_id title"
        )
        .lean();

    if (
      existingCourse
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `A course with slug "${slug}" already exists.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * LEVEL
     * --------------------------------------------------------
     */

    const level =
      cleanString(
        body?.level
      ).toUpperCase() ||
      "ALL_LEVELS";

    if (
      !isValidLevel(
        level
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid course level.",
        },
        {
          status: 400,
        }
      );
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
      "DRAFT";

    if (
      !isValidStatus(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid course status.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * PRICING
     * --------------------------------------------------------
     */

    const isFree =
      parseBoolean(
        body?.isFree,
        true
      );

    let price =
      parseNumber(
        body?.price,
        0
      );

    let discountPrice =
      parseNumber(
        body?.discountPrice,
        0
      );

    if (
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Price cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      discountPrice < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Discount price cannot be negative.",
        },
        {
          status: 400,
        }
      );
    }

    if (isFree) {
      price = 0;
      discountPrice = 0;
    } else {
      if (
        price <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Paid courses must have a price greater than zero.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        discountPrice >
        price
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Discount price cannot be greater than course price.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * --------------------------------------------------------
     * CURRENCY
     * --------------------------------------------------------
     */

    const currency =
      cleanString(
        body?.currency
      ).toUpperCase() ||
      "INR";

    if (
      currency.length >
      10
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Currency cannot exceed 10 characters.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * INSTRUCTOR
     * --------------------------------------------------------
     *
     * We DO NOT trust instructorName from the browser.
     *
     * The server loads the actual User record and takes
     * the name from the database.
     *
     * --------------------------------------------------------
     */

    let instructor:
      | mongoose.Types.ObjectId
      | null =
      null;

    let instructorName =
      "";

    const instructorInput =
      cleanString(
        body?.instructor
      );

    if (
      instructorInput
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          instructorInput
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid instructor ID.",
          },
          {
            status: 400,
          }
        );
      }

      const instructorUser =
        await User.findOne({
          _id:
            instructorInput,
          isActive: true,
        })
          .select(
            "_id name email role isActive"
          )
          .lean();

      if (
        !instructorUser
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected instructor was not found or is inactive.",
          },
          {
            status: 400,
          }
        );
      }

      instructor =
        new mongoose.Types.ObjectId(
          instructorInput
        );

      instructorName =
        cleanString(
          instructorUser.name
        );
    }

    /*
     * --------------------------------------------------------
     * FEATURED
     * --------------------------------------------------------
     */

    const featured =
      parseBoolean(
        body?.featured,
        false
      );

    /*
     * --------------------------------------------------------
     * CERTIFICATE
     * --------------------------------------------------------
     */

    const certificateEnabled =
      parseBoolean(
        body?.certificateEnabled,
        false
      );

    const certificateName =
      cleanString(
        body?.certificateName
      );

    if (
      certificateName.length >
      200
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate name cannot exceed 200 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      certificateEnabled &&
      !certificateName
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate name is required when certificates are enabled.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * ARRAYS
     * --------------------------------------------------------
     */

    const requirements =
      cleanStringArray(
        body?.requirements,
        100,
        500
      );

    const learningOutcomes =
      cleanStringArray(
        body?.learningOutcomes,
        100,
        500
      );

    const targetAudience =
      cleanStringArray(
        body?.targetAudience,
        100,
        500
      );

    const tags =
      cleanStringArray(
        body?.tags,
        100,
        50
      ).map(
        (
          tag
        ) =>
          tag.toLowerCase()
      );

    /*
     * --------------------------------------------------------
     * NEW COURSE COUNTERS
     * --------------------------------------------------------
     *
     * These must never be controlled by the client.
     * --------------------------------------------------------
     */

    const durationMinutes =
      0;

    const lessonCount =
      0;

    const moduleCount =
      0;

    const enrollmentCount =
      0;

    const completionCount =
      0;

    /*
     * --------------------------------------------------------
     * PUBLICATION DATE
     * --------------------------------------------------------
     *
     * Course model will also normalize this during
     * validation.
     * --------------------------------------------------------
     */

    const publishedAt =
      status ===
      "PUBLISHED"
        ? new Date()
        : null;

    /*
     * --------------------------------------------------------
     * CREATE COURSE
     * --------------------------------------------------------
     */

    console.log(
      "[ADMIN COURSES][POST] Creating course:",
      {
        title,
        slug,
        category,
        level,
        status,
        isFree,
        price,
        discountPrice,
        instructor:
          instructor
            ? String(
                instructor
              )
            : null,
        instructorName,
        createdBy:
          String(
            adminId
          ),
      }
    );

    const course =
      await Course.create({
        title,

        slug,

        shortDescription,

        description,

        thumbnail:
          cleanString(
            body?.thumbnail
          ),

        bannerImage:
          cleanString(
            body?.bannerImage
          ),

        category,

        subCategory,

        level,

        language,

        instructor,

        instructorName,

        status,

        featured,

        isFree,

        price,

        discountPrice,

        currency,

        durationMinutes,

        lessonCount,

        moduleCount,

        requirements,

        learningOutcomes,

        targetAudience,

        tags,

        rating: {
          average: 0,
          count: 0,
        },

        enrollmentCount,

        completionCount,

        certificateEnabled,

        certificateName,

        publishedAt,

        createdBy:
          adminId,

        updatedBy:
          null,
      });

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    const responseCourse =
      course.toObject();

    return NextResponse.json(
      {
        success: true,

        message:
          status ===
          "PUBLISHED"
            ? "Course published successfully."
            : "Course saved as draft successfully.",

        course: {
          ...responseCourse,

          _id: String(
            course._id
          ),

          createdBy:
            String(
              course.createdBy
            ),

          updatedBy:
            course.updatedBy
              ? String(
                  course.updatedBy
                )
              : null,

          instructor:
            course.instructor
              ? String(
                  course.instructor
                )
              : null,
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
      "[ADMIN COURSES][POST] CREATE ERROR"
    );

    console.error(
      "============================================================"
    );

    console.error(
      "Error:",
      error
    );

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Code:",
      error?.code
    );

    /*
     * --------------------------------------------------------
     * MONGOOSE VALIDATION ERROR
     * --------------------------------------------------------
     */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const validationErrors: Record<
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
        validationErrors[
          field
        ] =
          (fieldError as any)
            ?.message ||
          "Invalid value";
      }

      console.error(
        "[ADMIN COURSES][POST] VALIDATION ERRORS:",
        validationErrors
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Course validation failed.",

          errors:
            validationErrors,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DUPLICATE KEY
     * --------------------------------------------------------
     */

    if (
      error?.code ===
      11000
    ) {
      const duplicateField =
        Object.keys(
          error.keyPattern ||
            error.keyValue ||
            {}
        )[0] ||
        "field";

      const duplicateValue =
        error.keyValue
          ?.[
            duplicateField
          ];

      return NextResponse.json(
        {
          success: false,

          message:
            duplicateField ===
            "slug"
              ? `A course with slug "${duplicateValue}" already exists.`
              : `A course with this ${duplicateField} already exists.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * CAST ERROR
     * --------------------------------------------------------
     */

    if (
      error?.name ===
      "CastError"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            `Invalid value for ${error.path || "course field"}.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DEVELOPMENT ERROR
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: false,

        message:
          process.env.NODE_ENV ===
          "development"
            ? error?.message ||
              "Unable to create course."
            : "Unable to create course.",

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