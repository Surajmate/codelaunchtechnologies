import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";
import CourseEnrollment from "@/models/CourseEnrollment";

/*
 * ======================================================
 * USER COURSES API
 * ======================================================
 *
 * GET
 * /api/courses
 *
 * Returns published courses available to the
 * authenticated user.
 *
 * Supported query parameters:
 *
 * ?page=1
 * ?limit=12
 * ?search=mulesoft
 * ?category=Integration
 * ?level=BEGINNER
 * ?isFree=true
 * ?featured=true
 * ?sort=newest
 *
 * Sort options:
 *
 * newest
 * oldest
 * popular
 * rating
 *
 * ======================================================
 */

const ALLOWED_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
];

const ALLOWED_SORTS = [
  "newest",
  "oldest",
  "popular",
  "rating",
];

/*
 * ======================================================
 * ESCAPE REGEX
 * ======================================================
 */

function escapeRegex(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
 * ======================================================
 * SAFE NUMBER
 * ======================================================
 */

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  maximum: number
) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return Math.min(
    Math.floor(parsed),
    maximum
  );
}

/*
 * ======================================================
 * GET COURSES
 * ======================================================
 */

export async function GET(
  request: Request
) {
  try {
    console.log(
      "[USER COURSES] GET started"
    );

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * --------------------------------------------------
     * DATABASE
     * --------------------------------------------------
     */

    await connectDB();

    /*
     * --------------------------------------------------
     * QUERY PARAMETERS
     * --------------------------------------------------
     */

    const { searchParams } =
      new URL(request.url);

    /*
     * Page
     */

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        1,
        100000
      );

    /*
     * Limit
     *
     * Allow up to 1000 because:
     *
     * - Certificate course selector
     * - Admin-like selectors
     * - Bulk course selection
     *
     * may request a larger page.
     */

    const limit =
      parsePositiveInteger(
        searchParams.get("limit"),
        12,
        1000
      );

    const skip =
      (page - 1) * limit;

    /*
     * Search
     */

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    /*
     * Category
     */

    const category =
      searchParams
        .get("category")
        ?.trim() || "";

    /*
     * Level
     */

    const level =
      searchParams
        .get("level")
        ?.trim()
        .toUpperCase() || "";

    /*
     * Free / paid
     */

    const isFree =
      searchParams.get("isFree");

    /*
     * Featured
     */

    const featured =
      searchParams.get("featured");

    /*
     * Sort
     */

    const requestedSort =
      searchParams
        .get("sort")
        ?.trim()
        .toLowerCase() || "newest";

    const sort =
      ALLOWED_SORTS.includes(
        requestedSort
      )
        ? requestedSort
        : "newest";

    /*
     * --------------------------------------------------
     * BUILD FILTER
     * --------------------------------------------------
     *
     * IMPORTANT:
     *
     * User-facing course APIs only expose
     * published courses.
     *
     * Draft and archived courses are never
     * returned here.
     *
     * --------------------------------------------------
     */

    const filter: Record<
      string,
      unknown
    > = {
      status: "PUBLISHED",
    };

    /*
     * --------------------------------------------------
     * SEARCH
     * --------------------------------------------------
     */

    if (search) {
      const escapedSearch =
        escapeRegex(search);

      const searchRegex =
        new RegExp(
          escapedSearch,
          "i"
        );

      filter.$or = [
        {
          title:
            searchRegex,
        },

        {
          shortDescription:
            searchRegex,
        },

        {
          description:
            searchRegex,
        },

        {
          category:
            searchRegex,
        },

        {
          subCategory:
            searchRegex,
        },

        {
          tags:
            searchRegex,
        },

        {
          instructorName:
            searchRegex,
        },
      ];
    }

    /*
     * --------------------------------------------------
     * CATEGORY
     * --------------------------------------------------
     */

    if (category) {
      filter.category =
        category;
    }

    /*
     * --------------------------------------------------
     * LEVEL
     * --------------------------------------------------
     */

    if (level) {
      if (
        ALLOWED_LEVELS.includes(
          level
        )
      ) {
        filter.level =
          level;
      }
    }

    /*
     * --------------------------------------------------
     * FREE / PAID
     * --------------------------------------------------
     */

    if (
      isFree === "true"
    ) {
      filter.isFree = true;
    }

    if (
      isFree === "false"
    ) {
      filter.isFree = false;
    }

    /*
     * --------------------------------------------------
     * FEATURED
     * --------------------------------------------------
     */

    if (
      featured === "true"
    ) {
      filter.featured = true;
    }

    /*
     * --------------------------------------------------
     * SORTING
     * --------------------------------------------------
     */

    let sortOption:
      Record<string, 1 | -1>;

    switch (sort) {
      case "popular":
        sortOption = {
          enrollmentCount: -1,
          createdAt: -1,
        };
        break;

      case "rating":
        sortOption = {
          "rating.average": -1,
          "rating.count": -1,
          createdAt: -1,
        };
        break;

      case "oldest":
        sortOption = {
          createdAt: 1,
        };
        break;

      case "newest":
      default:
        sortOption = {
          createdAt: -1,
        };
        break;
    }

    /*
     * --------------------------------------------------
     * COURSE PROJECTION
     * --------------------------------------------------
     *
     * Only return fields required by the user UI.
     *
     * --------------------------------------------------
     */

    const courseProjection = [
      "_id",
      "title",
      "slug",
      "shortDescription",
      "thumbnail",
      "bannerImage",
      "category",
      "subCategory",
      "level",
      "language",
      "instructor",
      "instructorName",
      "status",
      "featured",
      "isFree",
      "price",
      "discountPrice",
      "currency",
      "durationMinutes",
      "lessonCount",
      "moduleCount",
      "learningOutcomes",
      "tags",
      "rating",
      "enrollmentCount",
      "completionCount",
      "certificateEnabled",
      "certificateName",
      "publishedAt",
      "createdAt",
      "updatedAt",
    ].join(" ");

    /*
     * --------------------------------------------------
     * FETCH COURSES + TOTAL
     * --------------------------------------------------
     */

    const [
      courses,
      total,
    ] = await Promise.all([
      Course.find(filter)
        .select(
          courseProjection
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),

      Course.countDocuments(
        filter
      ),
    ]);

    /*
     * --------------------------------------------------
     * COURSE IDS
     * --------------------------------------------------
     */

    const courseIds =
      courses.map(
        (course: any) =>
          course._id
      );

    /*
     * --------------------------------------------------
     * FETCH USER ENROLLMENTS
     * --------------------------------------------------
     *
     * One query for all returned courses.
     *
     * Avoids N+1 database queries.
     *
     * --------------------------------------------------
     */

    let enrollments: any[] =
      [];

    if (
      courseIds.length > 0
    ) {
      enrollments =
        await CourseEnrollment.find(
          {
            user:
              user.id,

            course: {
              $in:
                courseIds,
            },
          }
        )
          .select(
            [
              "course",
              "status",
              "progress",
              "completedLessonCount",
              "totalLessonCount",
              "lastAccessedLesson",
              "lastAccessedModule",
              "lastAccessedAt",
              "startedAt",
              "completedAt",
              "certificate",
              "enrolledAt",
            ].join(" ")
          )
          .lean();
    }

    /*
     * --------------------------------------------------
     * ENROLLMENT MAP
     * --------------------------------------------------
     */

    const enrollmentMap =
      new Map<
        string,
        any
      >();

    for (
      const enrollment of enrollments
    ) {
      enrollmentMap.set(
        String(
          enrollment.course
        ),
        enrollment
      );
    }

    /*
     * --------------------------------------------------
     * FORMAT COURSES
     * --------------------------------------------------
     */

    const formattedCourses =
      courses.map(
        (course: any) => {
          const courseId =
            String(
              course._id
            );

          const enrollment =
            enrollmentMap.get(
              courseId
            );

          /*
           * Normalize numeric values.
           */

          const enrollmentCount =
            Number(
              course.enrollmentCount ||
                0
            );

          const completionCount =
            Number(
              course.completionCount ||
                0
            );

          const durationMinutes =
            Number(
              course.durationMinutes ||
                0
            );

          const lessonCount =
            Number(
              course.lessonCount ||
                0
            );

          const moduleCount =
            Number(
              course.moduleCount ||
                0
            );

          /*
           * ------------------------------------------------
           * ENROLLMENT OBJECT
           * ------------------------------------------------
           */

          const formattedEnrollment =
            enrollment
              ? {
                  enrolled:
                    true,

                  status:
                    enrollment.status ||
                    null,

                  progress:
                    Number(
                      enrollment.progress ||
                        0
                    ),

                  completedLessonCount:
                    Number(
                      enrollment.completedLessonCount ||
                        0
                    ),

                  totalLessonCount:
                    Number(
                      enrollment.totalLessonCount ||
                        lessonCount
                    ),

                  lastAccessedLesson:
                    enrollment.lastAccessedLesson
                      ? String(
                          enrollment.lastAccessedLesson
                        )
                      : null,

                  lastAccessedModule:
                    enrollment.lastAccessedModule
                      ? String(
                          enrollment.lastAccessedModule
                        )
                      : null,

                  lastAccessedAt:
                    enrollment.lastAccessedAt ||
                    null,

                  startedAt:
                    enrollment.startedAt ||
                    null,

                  completedAt:
                    enrollment.completedAt ||
                    null,

                  certificate:
                    enrollment.certificate ||
                    null,

                  enrolledAt:
                    enrollment.enrolledAt ||
                    null,
                }
              : {
                  enrolled:
                    false,

                  status:
                    null,

                  progress:
                    0,

                  completedLessonCount:
                    0,

                  totalLessonCount:
                    lessonCount,

                  lastAccessedLesson:
                    null,

                  lastAccessedModule:
                    null,

                  lastAccessedAt:
                    null,

                  startedAt:
                    null,

                  completedAt:
                    null,

                  certificate:
                    null,

                  enrolledAt:
                    null,
                };

          /*
           * ------------------------------------------------
           * RETURN COURSE
           * ------------------------------------------------
           */

          return {
            _id:
              courseId,

            title:
              course.title,

            slug:
              course.slug,

            shortDescription:
              course.shortDescription ||
              "",

            thumbnail:
              course.thumbnail ||
              "",

            bannerImage:
              course.bannerImage ||
              "",

            category:
              course.category ||
              "",

            subCategory:
              course.subCategory ||
              "",

            level:
              course.level ||
              "ALL_LEVELS",

            language:
              course.language ||
              "English",

            instructor:
              course.instructor
                ? String(
                    course.instructor
                  )
                : null,

            instructorName:
              course.instructorName ||
              "",

            status:
              course.status,

            featured:
              Boolean(
                course.featured
              ),

            isFree:
              Boolean(
                course.isFree
              ),

            price:
              Number(
                course.price ||
                  0
              ),

            discountPrice:
              Number(
                course.discountPrice ||
                  0
              ),

            currency:
              course.currency ||
              "INR",

            durationMinutes,

            lessonCount,

            moduleCount,

            learningOutcomes:
              Array.isArray(
                course.learningOutcomes
              )
                ? course.learningOutcomes
                : [],

            tags:
              Array.isArray(
                course.tags
              )
                ? course.tags
                : [],

            rating:
              course.rating
                ? {
                    average:
                      Number(
                        course
                          .rating
                          .average ||
                          0
                      ),

                    count:
                      Number(
                        course
                          .rating
                          .count ||
                          0
                      ),
                  }
                : {
                    average: 0,
                    count: 0,
                  },

            enrollmentCount,

            completionCount,

            certificateEnabled:
              Boolean(
                course.certificateEnabled
              ),

            certificateName:
              course.certificateName ||
              "",

            publishedAt:
              course.publishedAt ||
              null,

            createdAt:
              course.createdAt,

            updatedAt:
              course.updatedAt,

            /*
             * ----------------------------------------------
             * USER ENROLLMENT
             * ----------------------------------------------
             */

            enrollment:
              formattedEnrollment,
          };
        }
      );

    /*
     * --------------------------------------------------
     * PAGINATION
     * --------------------------------------------------
     */

    const totalPages =
      total > 0
        ? Math.ceil(
            total / limit
          )
        : 0;

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      courses:
        formattedCourses,

      pagination: {
        page,

        limit,

        total,

        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1 &&
          totalPages > 0,
      },

      filters: {
        search,

        category,

        level:
          level &&
          ALLOWED_LEVELS.includes(
            level
          )
            ? level
            : null,

        isFree:
          isFree === "true"
            ? true
            : isFree === "false"
            ? false
            : null,

        featured:
          featured === "true"
            ? true
            : null,

        sort,
      },
    });
  } catch (error) {
    console.error(
      "[USER COURSES] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load courses",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}