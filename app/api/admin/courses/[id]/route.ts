import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";

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

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function cleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function cleanStringArray(
  value: unknown,
  maxItems = 100
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function isValidObjectId(
  value: unknown
): boolean {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
}

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
 * ============================================================
 * ADMIN AUTH
 * ============================================================
 */

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      status: 401,
      message: "Unauthorized",
      user: null,
    };
  }

  const currentUser = user as typeof user & {
    role?: string;
    isAdmin?: boolean;
  };

  const role = cleanString(
    currentUser.role
  ).toUpperCase();

  const isAdmin =
    currentUser.isAdmin === true ||
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
 * GET SINGLE COURSE
 * ============================================================
 *
 * GET /api/admin/courses/:id
 *
 * ============================================================
 */

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /*
     * --------------------------------------------------------
     * AUTH
     * --------------------------------------------------------
     */

    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * PARAMS
     * --------------------------------------------------------
     */

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid course ID.",
        },
        {
          status: 400,
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
     * FETCH COURSE
     * --------------------------------------------------------
     */

    const course = await Course.findById(id)
      .populate({
        path: "instructor",
        select: "_id name email",
      })
      .populate({
        path: "createdBy",
        select: "_id name email",
      })
      .populate({
        path: "updatedBy",
        select: "_id name email",
      })
      .lean();

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * NORMALIZE
     * --------------------------------------------------------
     */

    const normalizedCourse = {
      ...course,

      _id: String(course._id),

      instructor: course.instructor
        ? {
            ...(course.instructor as any),
            _id: String(
              (course.instructor as any)._id
            ),
          }
        : null,

      createdBy: course.createdBy
        ? {
            ...(course.createdBy as any),
            _id: String(
              (course.createdBy as any)._id
            ),
          }
        : null,

      updatedBy: course.updatedBy
        ? {
            ...(course.updatedBy as any),
            _id: String(
              (course.updatedBy as any)._id
            ),
          }
        : null,

      price: Number(course.price || 0),

      discountPrice: Number(
        course.discountPrice || 0
      ),

      durationMinutes: Number(
        course.durationMinutes || 0
      ),

      lessonCount: Number(
        course.lessonCount || 0
      ),

      moduleCount: Number(
        course.moduleCount || 0
      ),

      enrollmentCount: Number(
        course.enrollmentCount || 0
      ),

      completionCount: Number(
        course.completionCount || 0
      ),

      featured: Boolean(course.featured),

      isFree: Boolean(course.isFree),

      certificateEnabled: Boolean(
        course.certificateEnabled
      ),
    };

    return NextResponse.json({
      success: true,
      course: normalizedCourse,
    });
  } catch (error) {
    console.error(
      "[ADMIN COURSES][GET BY ID]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load course.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * UPDATE COURSE
 * ============================================================
 *
 * PUT /api/admin/courses/:id
 *
 * PATCH is also supported below.
 *
 * ============================================================
 */

async function updateCourse(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /*
     * --------------------------------------------------------
     * AUTH
     * --------------------------------------------------------
     */

    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * PARAMS
     * --------------------------------------------------------
     */

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid course ID.",
        },
        {
          status: 400,
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
     * CURRENT COURSE
     * --------------------------------------------------------
     */

    const existingCourse =
      await Course.findById(id);

    if (!existingCourse) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * BODY
     * --------------------------------------------------------
     */

    let body: any;

    try {
      body = await request.json();
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

    /*
     * --------------------------------------------------------
     * AUTH USER
     * --------------------------------------------------------
     */

    const currentUser = auth.user as any;

    const userId =
      currentUser?.id ||
      currentUser?._id;

    if (
      !userId ||
      !isValidObjectId(String(userId))
    ) {
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

    const adminId =
      new mongoose.Types.ObjectId(
        String(userId)
      );

    /*
     * --------------------------------------------------------
     * PROTECTED FIELDS
     * --------------------------------------------------------
     *
     * Never accept these from the frontend.
     * --------------------------------------------------------
     */

    delete body.createdBy;
    delete body.updatedBy;

    /*
     * --------------------------------------------------------
     * TITLE
     * --------------------------------------------------------
     */

    if (
      body.title !== undefined
    ) {
      const title = cleanString(
        body.title
      );

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Course title cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      if (title.length < 3) {
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

      if (title.length > 200) {
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

      existingCourse.title = title;
    }

    /*
     * --------------------------------------------------------
     * SLUG
     * --------------------------------------------------------
     */

    if (
      body.slug !== undefined
    ) {
      const slug = cleanString(
        body.slug
      ).toLowerCase();

      if (!slug) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Course slug cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
          slug
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Slug can contain only lowercase letters, numbers and hyphens.",
          },
          {
            status: 400,
          }
        );
      }

      const duplicate =
        await Course.findOne({
          slug,
          _id: {
            $ne: id,
          },
        })
          .select("_id")
          .lean();

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another course already uses this slug.",
          },
          {
            status: 409,
          }
        );
      }

      existingCourse.slug = slug;
    }

    /*
     * --------------------------------------------------------
     * SHORT DESCRIPTION
     * --------------------------------------------------------
     */

    if (
      body.shortDescription !==
      undefined
    ) {
      const value =
        cleanString(
          body.shortDescription
        );

      if (value.length < 10) {
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

      if (value.length > 500) {
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

      existingCourse.shortDescription =
        value;
    }

    /*
     * --------------------------------------------------------
     * DESCRIPTION
     * --------------------------------------------------------
     */

    if (
      body.description !==
      undefined
    ) {
      const value =
        cleanString(
          body.description
        );

      if (value.length < 20) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Description must be at least 20 characters.",
          },
          {
            status: 400,
          }
        );
      }

      if (value.length > 20000) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Description cannot exceed 20,000 characters.",
          },
          {
            status: 400,
          }
        );
      }

      existingCourse.description =
        value;
    }

    /*
     * --------------------------------------------------------
     * CATEGORY
     * --------------------------------------------------------
     */

    if (
      body.category !==
      undefined
    ) {
      const value =
        cleanString(
          body.category
        );

      if (!value) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Category cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      existingCourse.category =
        value;
    }

    /*
     * --------------------------------------------------------
     * SUB CATEGORY
     * --------------------------------------------------------
     */

    if (
      body.subCategory !==
      undefined
    ) {
      existingCourse.subCategory =
        cleanString(
          body.subCategory
        );
    }

    /*
     * --------------------------------------------------------
     * LEVEL
     * --------------------------------------------------------
     */

    if (
      body.level !==
      undefined
    ) {
      const level =
        cleanString(
          body.level
        ).toUpperCase();

      if (!isValidLevel(level)) {
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

      existingCourse.level =
        level;
    }

    /*
     * --------------------------------------------------------
     * LANGUAGE
     * --------------------------------------------------------
     */

    if (
      body.language !==
      undefined
    ) {
      const language =
        cleanString(
          body.language
        );

      if (!language) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Language cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      existingCourse.language =
        language;
    }

    /*
     * --------------------------------------------------------
     * IMAGES
     * --------------------------------------------------------
     */

    if (
      body.thumbnail !==
      undefined
    ) {
      existingCourse.thumbnail =
        cleanString(
          body.thumbnail
        );
    }

    if (
      body.bannerImage !==
      undefined
    ) {
      existingCourse.bannerImage =
        cleanString(
          body.bannerImage
        );
    }

    /*
     * --------------------------------------------------------
     * INSTRUCTOR
     * --------------------------------------------------------
     */

    if (
      body.instructor !==
      undefined
    ) {
      if (
        body.instructor ===
          null ||
        body.instructor ===
          ""
      ) {
        existingCourse.instructor =
          null;
      } else {
        if (
          !isValidObjectId(
            String(
              body.instructor
            )
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

        existingCourse.instructor =
          new mongoose.Types.ObjectId(
            String(
              body.instructor
            )
          );
      }
    }

    if (
      body.instructorName !==
      undefined
    ) {
      existingCourse.instructorName =
        cleanString(
          body.instructorName
        );
    }

    /*
     * --------------------------------------------------------
     * FEATURED
     * --------------------------------------------------------
     */

    if (
      body.featured !==
      undefined
    ) {
      existingCourse.featured =
        Boolean(
          body.featured
        );
    }

    /*
     * --------------------------------------------------------
     * PRICING
     * --------------------------------------------------------
     */

    if (
      body.isFree !==
      undefined
    ) {
      existingCourse.isFree =
        Boolean(
          body.isFree
        );
    }

    if (
      body.price !==
      undefined
    ) {
      const price =
        Number(
          body.price
        );

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Price must be a valid non-negative number.",
          },
          {
            status: 400,
          }
        );
      }

      existingCourse.price =
        price;
    }

    if (
      body.discountPrice !==
      undefined
    ) {
      const discountPrice =
        Number(
          body.discountPrice
        );

      if (
        !Number.isFinite(
          discountPrice
        ) ||
        discountPrice < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Discount price must be a valid non-negative number.",
          },
          {
            status: 400,
          }
        );
      }

      existingCourse.discountPrice =
        discountPrice;
    }

    if (
      existingCourse.isFree
    ) {
      existingCourse.price =
        0;

      existingCourse.discountPrice =
        0;
    } else {
      if (
        existingCourse.discountPrice >
        existingCourse.price
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

    if (
      body.currency !==
      undefined
    ) {
      const currency =
        cleanString(
          body.currency
        ).toUpperCase();

      if (
        !/^[A-Z]{3}$/.test(
          currency
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Currency must be a valid 3-letter currency code.",
          },
          {
            status: 400,
          }
        );
      }

      existingCourse.currency =
        currency;
    }

    /*
     * --------------------------------------------------------
     * ARRAYS
     * --------------------------------------------------------
     */

    if (
      body.requirements !==
      undefined
    ) {
      existingCourse.requirements =
        cleanStringArray(
          body.requirements
        );
    }

    if (
      body.learningOutcomes !==
      undefined
    ) {
      existingCourse.learningOutcomes =
        cleanStringArray(
          body.learningOutcomes
        );
    }

    if (
      body.targetAudience !==
      undefined
    ) {
      existingCourse.targetAudience =
        cleanStringArray(
          body.targetAudience
        );
    }

    if (
      body.tags !==
      undefined
    ) {
      existingCourse.tags =
        cleanStringArray(
          body.tags
        ).map(
          (tag) =>
            tag.toLowerCase()
        );
    }

    /*
     * --------------------------------------------------------
     * CERTIFICATE
     * --------------------------------------------------------
     */

    if (
      body.certificateEnabled !==
      undefined
    ) {
      existingCourse.certificateEnabled =
        Boolean(
          body.certificateEnabled
        );
    }

    if (
      body.certificateName !==
      undefined
    ) {
      const certificateName =
        cleanString(
          body.certificateName
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

      existingCourse.certificateName =
        certificateName;
    }

    /*
     * --------------------------------------------------------
     * STATUS
     * --------------------------------------------------------
     */

    if (
      body.status !==
      undefined
    ) {
      const requestedStatus =
        cleanString(
          body.status
        ).toUpperCase();

      if (
        !isValidStatus(
          requestedStatus
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
       * PUBLISH
       */

      if (
        requestedStatus ===
        "PUBLISHED"
      ) {
        /*
         * A course cannot be published without
         * the mandatory content.
         */

        const title =
          existingCourse.title;

        const shortDescription =
          existingCourse.shortDescription;

        const description =
          existingCourse.description;

        const category =
          existingCourse.category;

        if (
          !title ||
          title.length < 3
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Course must have a valid title before publishing.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          !shortDescription ||
          shortDescription.length <
            10
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Course must have a valid short description before publishing.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          !description ||
          description.length <
            20
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Course must have a valid description before publishing.",
            },
            {
              status: 400,
            }
          );
        }

        if (!category) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Course category is required before publishing.",
            },
            {
              status: 400,
            }
          );
        }

        existingCourse.status =
          "PUBLISHED";

        /*
         * Only set publishedAt if this is the
         * first publication.
         */

        if (
          !existingCourse.publishedAt
        ) {
          existingCourse.publishedAt =
            new Date();
        }
      }

      /*
       * DRAFT
       */

      else if (
        requestedStatus ===
        "DRAFT"
      ) {
        existingCourse.status =
          "DRAFT";

        /*
         * Keep publishedAt as historical information.
         * Do not erase it.
         */
      }

      /*
       * ARCHIVED
       */

      else if (
        requestedStatus ===
        "ARCHIVED"
      ) {
        existingCourse.status =
          "ARCHIVED";
      }
    }

    /*
     * --------------------------------------------------------
     * UPDATE AUDIT
     * --------------------------------------------------------
     */

    existingCourse.updatedBy =
      adminId;

    /*
     * --------------------------------------------------------
     * SAVE
     * --------------------------------------------------------
     */

    await existingCourse.save();

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        "Course updated successfully.",

      course: {
        ...existingCourse.toObject(),

        _id: String(
          existingCourse._id
        ),

        createdBy:
          existingCourse.createdBy
            ? String(
                existingCourse.createdBy
              )
            : null,

        updatedBy:
          existingCourse.updatedBy
            ? String(
                existingCourse.updatedBy
              )
            : null,
      },
    });
  } catch (error: any) {
    console.error(
      "[ADMIN COURSES][UPDATE]",
      error
    );

    /*
     * Mongoose validation
     */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const errors =
        Object.values(
          error.errors || {}
        ).map(
          (item: any) => ({
            field: item.path,
            message:
              item.message,
          })
        );

      return NextResponse.json(
        {
          success: false,
          message:
            "Course validation failed.",
          errors,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Duplicate key
     */

    if (
      error?.code ===
      11000
    ) {
      const field =
        Object.keys(
          error.keyPattern || {}
        )[0] || "field";

      return NextResponse.json(
        {
          success: false,
          message:
            `A course with this ${field} already exists.`,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update course.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * PUT
 * ============================================================
 */

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  return updateCourse(
    request,
    context
  );
}

/*
 * ============================================================
 * PATCH
 * ============================================================
 */

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  return updateCourse(
    request,
    context
  );
}

/*
 * ============================================================
 * DELETE COURSE
 * ============================================================
 *
 * DELETE /api/admin/courses/:id
 *
 * For safety, this performs a soft delete by changing
 * the status to ARCHIVED rather than permanently deleting
 * the course.
 *
 * ============================================================
 */

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    /*
     * --------------------------------------------------------
     * AUTH
     * --------------------------------------------------------
     */

    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * PARAMS
     * --------------------------------------------------------
     */

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
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
     * --------------------------------------------------------
     * DATABASE
     * --------------------------------------------------------
     */

    await connectDB();

    const course =
      await Course.findById(id);

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * ADMIN ID
     * --------------------------------------------------------
     */

    const currentUser =
      auth.user as any;

    const userId =
      currentUser?.id ||
      currentUser?._id;

    if (
      !userId ||
      !isValidObjectId(
        String(userId)
      )
    ) {
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

    /*
     * --------------------------------------------------------
     * SOFT DELETE
     * --------------------------------------------------------
     */

    course.status =
      "ARCHIVED";

    course.updatedBy =
      new mongoose.Types.ObjectId(
        String(userId)
      );

    await course.save();

    return NextResponse.json({
      success: true,

      message:
        "Course archived successfully.",

      courseId: String(
        course._id
      ),
    });
  } catch (error: any) {
    console.error(
      "[ADMIN COURSES][DELETE]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to archive course.",
      },
      {
        status: 500,
      }
    );
  }
}