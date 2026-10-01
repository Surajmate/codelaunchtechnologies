import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";
import CourseModule from "@/models/CourseModule";
import CourseLesson from "@/models/CourseLesson";
import CourseEnrollment from "@/models/CourseEnrollment";
import Certificate from "@/models/Certificate";
import UserCertificate from "@/models/UserCertificate";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ======================================================
 * GET COURSE DETAILS
 * ======================================================
 *
 * GET
 * /api/courses/[id]
 *
 * [id] can be:
 *
 * - Course MongoDB ObjectId
 * - Course slug
 *
 * Example:
 *
 * /api/courses/68abc123...
 *
 * /api/courses/complete-mulesoft-development
 *
 * ======================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[USER COURSE DETAILS] GET started"
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
          message: "Unauthorized",
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
     * PARAMETER
     * --------------------------------------------------
     */

    const { id } =
      await context.params;

    const courseIdentifier =
      id?.trim();

    if (!courseIdentifier) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course ID or slug is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * FIND COURSE
     * --------------------------------------------------
     *
     * Supports:
     *
     * 1. MongoDB ObjectId
     * 2. Course slug
     *
     * Only published courses are available
     * through the user-facing API.
     *
     * --------------------------------------------------
     */

    let course: any = null;

    if (
      isValidObjectId(
        courseIdentifier
      )
    ) {
      course =
        await Course.findOne({
          _id: courseIdentifier,
          status: "PUBLISHED",
        }).lean();
    }

    /*
     * If ObjectId lookup did not find anything,
     * try slug.
     */

    if (!course) {
      course =
        await Course.findOne({
          slug:
            courseIdentifier.toLowerCase(),
          status: "PUBLISHED",
        }).lean();
    }

    /*
     * --------------------------------------------------
     * COURSE NOT FOUND
     * --------------------------------------------------
     */

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course not found",
        },
        {
          status: 404,
        }
      );
    }

    const courseId =
      String(course._id);

    /*
     * --------------------------------------------------
     * LOAD ENROLLMENT
     * --------------------------------------------------
     *
     * Enrollment is user-specific.
     *
     * --------------------------------------------------
     */

    const enrollment =
      await CourseEnrollment.findOne({
        user: user.id,
        course: course._id,
      })
        .select(
          [
            "_id",
            "status",
            "progress",
            "completedLessons",
            "completedLessonCount",
            "totalLessonCount",
            "lastAccessedLesson",
            "lastAccessedModule",
            "lastAccessedAt",
            "startedAt",
            "completedAt",
            "certificate",
            "enrolledAt",
            "expiresAt",
            "timeSpentSeconds",
          ].join(" ")
        )
        .lean();

    /*
     * --------------------------------------------------
     * ENROLLMENT STATE
     * --------------------------------------------------
     */

    const isEnrolled =
      Boolean(enrollment);

    /*
     * Enrollment status:
     *
     * ACTIVE
     * COMPLETED
     *
     * are considered learning-enabled.
     *
     * If the enrollment has expired, learning access
     * is disabled.
     * --------------------------------------------------
     */

    const enrollmentExpired =
      Boolean(
        enrollment?.expiresAt &&
          new Date(
            enrollment.expiresAt
          ).getTime() <=
            Date.now()
      );

    const isActiveEnrollment =
      Boolean(
        enrollment &&
          (
            enrollment.status ===
              "ACTIVE" ||
            enrollment.status ===
              "COMPLETED"
          ) &&
          !enrollmentExpired
      );

    /*
     * --------------------------------------------------
     * FETCH CERTIFICATE DEFINITION
     * --------------------------------------------------
     *
     * A course may have an active certificate
     * definition.
     *
     * --------------------------------------------------
     */

    const certificateDefinition =
      await Certificate.findOne({
        course: course._id,
        status: "ACTIVE",
        isActive: true,
      })
        .select(
          [
            "_id",
            "title",
            "description",
            "course",
            "issuer",
            "issuerName",
            "issuerLogo",
            "template",
            "validity",
            "validityDays",
            "status",
            "isActive",
            "requirements",
          ].join(" ")
        )
        .lean();

    /*
     * --------------------------------------------------
     * FETCH USER CERTIFICATE
     * --------------------------------------------------
     *
     * This is the actual certificate issued to the
     * logged-in user.
     *
     * Do NOT use another user's certificate.
     *
     * --------------------------------------------------
     */

    const userCertificate =
      certificateDefinition
        ? await UserCertificate.findOne(
            {
              user: user.id,

              certificate:
                certificateDefinition._id,

              course:
                course._id,
            }
          )
            .select(
              [
                "_id",
                "user",
                "certificate",
                "course",
                "certificateNumber",
                "verificationCode",
                "status",
                "issuedAt",
                "expiresAt",
                "revokedAt",
                "revokedReason",
                "finalScore",
                "completionPercentage",
                "pdfUrl",
                "metadata",
                "createdAt",
                "updatedAt",
              ].join(" ")
            )
            .lean()
        : null;

    /*
     * --------------------------------------------------
     * FETCH PUBLISHED MODULES
     * --------------------------------------------------
     *
     * Users only see published modules.
     *
     * --------------------------------------------------
     */

    const modules =
      await CourseModule.find({
        course: course._id,
        status: "PUBLISHED",
      })
        .select(
          [
            "_id",
            "course",
            "title",
            "slug",
            "description",
            "order",
            "preview",
            "lessonCount",
            "durationMinutes",
          ].join(" ")
        )
        .sort({
          order: 1,
        })
        .lean();

    /*
     * --------------------------------------------------
     * MODULE IDS
     * --------------------------------------------------
     */

    const moduleIds =
      modules.map(
        (module: any) =>
          module._id
      );

    /*
     * --------------------------------------------------
     * FETCH PUBLISHED LESSONS
     * --------------------------------------------------
     *
     * Only lessons belonging to published modules
     * are returned.
     *
     * --------------------------------------------------
     */

    const lessons =
      moduleIds.length > 0
        ? await CourseLesson.find({
            course: course._id,

            module: {
              $in: moduleIds,
            },

            status: "PUBLISHED",
          })
            .select(
              [
                "_id",
                "course",
                "module",
                "title",
                "slug",
                "shortDescription",
                "content",
                "type",
                "videoUrl",
                "videoProvider",
                "videoId",
                "documentUrl",
                "documentName",
                "externalUrl",
                "durationMinutes",
                "order",
                "preview",
                "required",
                "resources",
                "learningObjectives",
                "quiz",
                "assignment",
              ].join(" ")
            )
            .sort({
              order: 1,
            })
            .lean()
        : [];

    /*
     * --------------------------------------------------
     * COMPLETED LESSON SET
     * --------------------------------------------------
     */

    const completedLessonSet =
      new Set<string>(
        (
          enrollment?.completedLessons ||
          []
        ).map(
          (lessonId: any) =>
            String(lessonId)
        )
      );

    /*
     * --------------------------------------------------
     * LAST ACCESSED LESSON
     * --------------------------------------------------
     */

    const lastAccessedLessonId =
      enrollment?.lastAccessedLesson
        ? String(
            enrollment.lastAccessedLesson
          )
        : null;

    /*
     * --------------------------------------------------
     * LAST ACCESSED MODULE
     * --------------------------------------------------
     */

    const lastAccessedModuleId =
      enrollment?.lastAccessedModule
        ? String(
            enrollment.lastAccessedModule
          )
        : null;

    /*
     * --------------------------------------------------
     * MAP LESSONS TO MODULES
     * --------------------------------------------------
     */

    const modulesWithLessons =
      modules.map(
        (module: any) => {
          /*
           * Find lessons belonging to this module.
           */

          const moduleLessons =
            lessons.filter(
              (lesson: any) =>
                String(
                  lesson.module
                ) ===
                String(
                  module._id
                )
            );

          /*
           * Calculate module duration from actual
           * lessons when cached value is unavailable.
           */

          const calculatedDuration =
            moduleLessons.reduce(
              (
                total: number,
                lesson: any
              ) =>
                total +
                Number(
                  lesson.durationMinutes ||
                    0
                ),
              0
            );

          /*
           * Calculate actual module lesson count.
           */

          const calculatedLessonCount =
            moduleLessons.length;

          /*
           * ------------------------------------------------
           * MODULE
           * ------------------------------------------------
           */

          return {
            _id:
              String(
                module._id
              ),

            course:
              String(
                module.course
              ),

            title:
              module.title,

            slug:
              module.slug,

            description:
              module.description ||
              "",

            order:
              Number(
                module.order || 0
              ),

            preview:
              Boolean(
                module.preview
              ),

            lessonCount:
              Number(
                module.lessonCount ??
                  calculatedLessonCount
              ),

            durationMinutes:
              Number(
                module.durationMinutes ??
                  calculatedDuration
              ),

            /*
             * ------------------------------------------------
             * LESSONS
             * ------------------------------------------------
             */

            lessons:
              moduleLessons.map(
                (
                  lesson: any
                ) => {
                  /*
                   * ------------------------------------------------
                   * ACCESS CONTROL
                   * ------------------------------------------------
                   *
                   * Enrolled active users:
                   *      access all published lessons.
                   *
                   * Non-enrolled users:
                   *      access preview lessons only.
                   *
                   * A lesson is previewable when:
                   *
                   * - module.preview = true
                   * OR
                   * - lesson.preview = true
                   *
                   * ------------------------------------------------
                   */

                  const canAccess =
                    isActiveEnrollment ||
                    Boolean(
                      module.preview ||
                        lesson.preview
                    );

                  const lessonId =
                    String(
                      lesson._id
                    );

                  /*
                   * ------------------------------------------------
                   * LESSON RESPONSE
                   * ------------------------------------------------
                   */

                  return {
                    _id:
                      lessonId,

                    course:
                      String(
                        lesson.course
                      ),

                    module:
                      String(
                        lesson.module
                      ),

                    title:
                      lesson.title,

                    slug:
                      lesson.slug,

                    shortDescription:
                      lesson.shortDescription ||
                      "",

                    type:
                      lesson.type,

                    durationMinutes:
                      Number(
                        lesson.durationMinutes ||
                          0
                      ),

                    order:
                      Number(
                        lesson.order || 0
                      ),

                    preview:
                      Boolean(
                        lesson.preview
                      ),

                    required:
                      lesson.required !==
                      false,

                    canAccess,

                    completed:
                      completedLessonSet.has(
                        lessonId
                      ),

                    isLastAccessed:
                      lastAccessedLessonId ===
                      lessonId,

                    /*
                     * ------------------------------------------------
                     * PROTECTED CONTENT
                     * ------------------------------------------------
                     *
                     * Never expose protected content to users
                     * who are not allowed to access the lesson.
                     *
                     * ------------------------------------------------
                     */

                    content:
                      canAccess
                        ? lesson.content ||
                          ""
                        : "",

                    videoUrl:
                      canAccess
                        ? lesson.videoUrl ||
                          ""
                        : "",

                    videoProvider:
                      canAccess
                        ? lesson.videoProvider ||
                          ""
                        : "",

                    videoId:
                      canAccess
                        ? lesson.videoId ||
                          ""
                        : "",

                    documentUrl:
                      canAccess
                        ? lesson.documentUrl ||
                          ""
                        : "",

                    documentName:
                      lesson.documentName ||
                      "",

                    externalUrl:
                      canAccess
                        ? lesson.externalUrl ||
                          ""
                        : "",

                    /*
                     * Quiz reference.
                     */

                    quiz:
                      canAccess &&
                      lesson.quiz
                        ? String(
                            lesson.quiz
                          )
                        : null,

                    /*
                     * Assignment reference.
                     */

                    assignment:
                      canAccess &&
                      lesson.assignment
                        ? String(
                            lesson.assignment
                          )
                        : null,

                    /*
                     * Resources.
                     */

                    resources:
                      canAccess
                        ? Array.isArray(
                            lesson.resources
                          )
                          ? lesson.resources
                          : []
                        : [],

                    /*
                     * Learning objectives are safe
                     * metadata and can be returned.
                     */

                    learningObjectives:
                      Array.isArray(
                        lesson.learningObjectives
                      )
                        ? lesson.learningObjectives
                        : [],
                  };
                }
              ),
          };
        }
      );

    /*
     * --------------------------------------------------
     * TOTAL LESSONS
     * --------------------------------------------------
     */

    const totalLessons =
      lessons.length;

    /*
     * --------------------------------------------------
     * COMPLETED LESSON COUNT
     * --------------------------------------------------
     *
     * Prefer the enrollment cached count when it is
     * greater than zero.
     *
     * Otherwise calculate from completedLessons.
     *
     * --------------------------------------------------
     */

    const completedLessonCount =
      enrollment
        ? Number(
            enrollment.completedLessonCount ??
              completedLessonSet.size
          )
        : 0;

    /*
     * Keep the value inside the actual curriculum
     * boundaries.
     */

    const safeCompletedLessonCount =
      Math.max(
        0,
        Math.min(
          completedLessonCount,
          totalLessons
        )
      );

    /*
     * --------------------------------------------------
     * COURSE PROGRESS
     * --------------------------------------------------
     *
     * Calculate from actual published lessons so
     * progress cannot exceed 100%.
     *
     * --------------------------------------------------
     */

    let progress = 0;

    if (
      enrollment &&
      totalLessons > 0
    ) {
      progress =
        Math.round(
          (
            safeCompletedLessonCount /
            totalLessons
          ) *
            100
        );
    }

    /*
     * If there are no lessons but the enrollment says
     * completed, retain 100%.
     */

    if (
      enrollment &&
      totalLessons === 0 &&
      enrollment.status ===
        "COMPLETED"
    ) {
      progress = 100;
    }

    progress =
      Math.max(
        0,
        Math.min(
          100,
          progress
        )
      );

    /*
     * --------------------------------------------------
     * COURSE CERTIFICATE INFORMATION
     * --------------------------------------------------
     */

    const certificateRequirements =
      certificateDefinition
        ?.requirements || {};

    const requiredCompletion =
      Number(
        certificateRequirements
          .completionPercentage ??
          100
      );

    /*
     * Certificate completion eligibility.
     *
     * This only checks course completion here.
     *
     * If minimumScore or final assessment is required,
     * actual issuance should be handled by the admin
     * issue endpoint after validating those conditions.
     */

    const completionEligible =
      Boolean(
        enrollment &&
          progress >=
            requiredCompletion
      );

    /*
     * Existing UserCertificate is authoritative.
     */

    const certificateIssued =
      Boolean(
        userCertificate &&
          userCertificate.status ===
            "ISSUED"
      );

    const certificateRevoked =
      Boolean(
        userCertificate &&
          userCertificate.status ===
            "REVOKED"
      );

    const certificateExpired =
      Boolean(
        userCertificate &&
          userCertificate.status ===
            "EXPIRED"
      );

    /*
     * --------------------------------------------------
     * CERTIFICATE RESPONSE
     * --------------------------------------------------
     *
     * Keep the response predictable for frontend use.
     * --------------------------------------------------
     */

    const certificateResponse =
      certificateDefinition
        ? {
            enabled: true,

            definition: {
              _id:
                String(
                  certificateDefinition._id
                ),

              title:
                certificateDefinition.title,

              description:
                certificateDefinition.description ||
                "",

              issuer:
                certificateDefinition.issuer ||
                "",

              issuerName:
                certificateDefinition.issuerName ||
                certificateDefinition.issuer ||
                "",

              issuerLogo:
                certificateDefinition.issuerLogo ||
                "",

              template:
                certificateDefinition.template ||
                "classic",

              validity:
                certificateDefinition.validity ||
                "PERMANENT",

              validityDays:
                certificateDefinition.validityDays ??
                null,

              requirements: {
                completionPercentage:
                  requiredCompletion,

                minimumScore:
                  certificateRequirements
                    .minimumScore ??
                  null,

                requireFinalAssessment:
                  Boolean(
                    certificateRequirements
                      .requireFinalAssessment
                  ),
              },
            },

            eligibility: {
              eligible:
                completionEligible,

              progress,

              requiredCompletion,

              remainingPercentage:
                Math.max(
                  0,
                  requiredCompletion -
                    progress
                ),
            },

            issued:
              certificateIssued,

            status:
              userCertificate?.status ||
              "NOT_ISSUED",

            certificate:
              userCertificate
                ? {
                    _id:
                      String(
                        userCertificate._id
                      ),

                    certificateNumber:
                      userCertificate.certificateNumber,

                    verificationCode:
                      userCertificate.verificationCode,

                    status:
                      userCertificate.status,

                    issuedAt:
                      userCertificate.issuedAt ||
                      null,

                    expiresAt:
                      userCertificate.expiresAt ||
                      null,

                    revokedAt:
                      userCertificate.revokedAt ||
                      null,

                    revokedReason:
                      userCertificate.revokedReason ||
                      "",

                    finalScore:
                      userCertificate.finalScore ??
                      null,

                    completionPercentage:
                      Number(
                        userCertificate.completionPercentage ||
                          0
                      ),

                    pdfUrl:
                      userCertificate.pdfUrl ||
                      "",

                    metadata:
                      userCertificate.metadata ||
                      {},
                  }
                : null,

            flags: {
              issued:
                certificateIssued,

              revoked:
                certificateRevoked,

              expired:
                certificateExpired,

              eligible:
                completionEligible,
            },
          }
        : {
            enabled: false,

            definition: null,

            eligibility: {
              eligible: false,

              progress,

              requiredCompletion: 100,

              remainingPercentage:
                Math.max(
                  0,
                  100 - progress
                ),
            },

            issued: false,

            status:
              "NOT_AVAILABLE",

            certificate: null,

            flags: {
              issued: false,

              revoked: false,

              expired: false,

              eligible: false,
            },
          };

    /*
     * --------------------------------------------------
     * COURSE RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      course: {
        /*
         * ----------------------------------------------
         * BASIC INFORMATION
         * ----------------------------------------------
         */

        _id:
          courseId,

        title:
          course.title,

        slug:
          course.slug,

        shortDescription:
          course.shortDescription ||
          "",

        description:
          course.description ||
          "",

        thumbnail:
          course.thumbnail ||
          "",

        bannerImage:
          course.bannerImage ||
          "",

        /*
         * ----------------------------------------------
         * CLASSIFICATION
         * ----------------------------------------------
         */

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

        /*
         * ----------------------------------------------
         * INSTRUCTOR
         * ----------------------------------------------
         */

        instructor:
          course.instructor
            ? String(
                course.instructor
              )
            : null,

        instructorName:
          course.instructorName ||
          "",

        /*
         * ----------------------------------------------
         * FLAGS
         * ----------------------------------------------
         */

        featured:
          Boolean(
            course.featured
          ),

        isFree:
          Boolean(
            course.isFree
          ),

        /*
         * ----------------------------------------------
         * PRICING
         * ----------------------------------------------
         */

        price:
          Number(
            course.price || 0
          ),

        discountPrice:
          Number(
            course.discountPrice || 0
          ),

        currency:
          course.currency ||
          "INR",

        /*
         * ----------------------------------------------
         * COURSE METRICS
         * ----------------------------------------------
         */

        durationMinutes:
          Number(
            course.durationMinutes ||
              0
          ),

        lessonCount:
          Number(
            course.lessonCount ||
              totalLessons
          ),

        moduleCount:
          Number(
            course.moduleCount ||
              modules.length
          ),

        /*
         * ----------------------------------------------
         * COURSE INFORMATION
         * ----------------------------------------------
         */

        requirements:
          Array.isArray(
            course.requirements
          )
            ? course.requirements
            : [],

        learningOutcomes:
          Array.isArray(
            course.learningOutcomes
          )
            ? course.learningOutcomes
            : [],

        targetAudience:
          Array.isArray(
            course.targetAudience
          )
            ? course.targetAudience
            : [],

        tags:
          Array.isArray(
            course.tags
          )
            ? course.tags
            : [],

        /*
         * ----------------------------------------------
         * RATING
         * ----------------------------------------------
         */

        rating:
          course.rating
            ? {
                average:
                  Number(
                    course.rating
                      .average || 0
                  ),

                count:
                  Number(
                    course.rating
                      .count || 0
                  ),
              }
            : {
                average: 0,
                count: 0,
              },

        /*
         * ----------------------------------------------
         * COUNTERS
         * ----------------------------------------------
         */

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

        /*
         * ----------------------------------------------
         * CERTIFICATE
         * ----------------------------------------------
         */

        certificateEnabled:
          Boolean(
            course.certificateEnabled ||
              certificateDefinition
          ),

        certificateName:
          course.certificateName ||
          certificateDefinition?.title ||
          "",

        certificate:
          certificateResponse,

        /*
         * ----------------------------------------------
         * DATES
         * ----------------------------------------------
         */

        publishedAt:
          course.publishedAt ||
          null,

        createdAt:
          course.createdAt ||
          null,

        updatedAt:
          course.updatedAt ||
          null,

        /*
         * ----------------------------------------------
         * USER ENROLLMENT
         * ----------------------------------------------
         */

        enrollment:
          enrollment
            ? {
                enrolled:
                  true,

                status:
                  enrollment.status,

                isActive:
                  isActiveEnrollment,

                expired:
                  enrollmentExpired,

                progress,

                completedLessonCount:
                  safeCompletedLessonCount,

                totalLessonCount:
                  totalLessons,

                completedLessons:
                  Array.from(
                    completedLessonSet
                  ),

                lastAccessedLesson:
                  lastAccessedLessonId,

                lastAccessedModule:
                  lastAccessedModuleId,

                lastAccessedAt:
                  enrollment.lastAccessedAt ||
                  null,

                startedAt:
                  enrollment.startedAt ||
                  null,

                completedAt:
                  enrollment.completedAt ||
                  null,

                enrolledAt:
                  enrollment.enrolledAt ||
                  null,

                expiresAt:
                  enrollment.expiresAt ||
                  null,

                timeSpentSeconds:
                  Number(
                    enrollment.timeSpentSeconds ||
                      0
                  ),

                /*
                 * Keep the old enrollment certificate
                 * information for backwards compatibility.
                 *
                 * The new `certificate` object above is
                 * authoritative.
                 */

                legacyCertificate:
                  enrollment.certificate ||
                  null,
              }
            : {
                enrolled:
                  false,

                status:
                  null,

                isActive:
                  false,

                expired:
                  false,

                progress: 0,

                completedLessonCount:
                  0,

                totalLessonCount:
                  totalLessons,

                completedLessons:
                  [],

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

                enrolledAt:
                  null,

                expiresAt:
                  null,

                timeSpentSeconds:
                  0,

                legacyCertificate:
                  null,
              },

        /*
         * ----------------------------------------------
         * CURRICULUM
         * ----------------------------------------------
         */

        modules:
          modulesWithLessons,
      },

      /*
       * ------------------------------------------------
       * ACCESS
       * ------------------------------------------------
       */

      access: {
        enrolled:
          isEnrolled,

        canLearn:
          isActiveEnrollment,

        canPreview:
          true,

        enrollmentExpired:
          enrollmentExpired,

        certificateEligible:
          completionEligible,

        certificateIssued:
          certificateIssued,
      },
    });
  } catch (error) {
    console.error(
      "[USER COURSE DETAILS] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load course",

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

/*
 * ======================================================
 * OBJECT ID VALIDATION
 * ======================================================
 *
 * We intentionally use a simple 24-character hexadecimal
 * check because the route supports both ObjectId and slug.
 *
 * This prevents invalid values from being sent directly
 * to MongoDB as ObjectIds.
 *
 * ======================================================
 */

function isValidObjectId(
  value: string
): boolean {
  return /^[a-fA-F0-9]{24}$/.test(
    value
  );
}