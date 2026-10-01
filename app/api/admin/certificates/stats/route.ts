import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Certificate from "@/models/Certificate";
import UserCertificate from "@/models/UserCertificate";

/*
 * ============================================================
 * GET ADMIN CERTIFICATE STATISTICS
 * ============================================================
 *
 * GET
 * /api/admin/certificates/stats
 *
 * Returns:
 *
 * - Certificate definition statistics
 * - Issued certificate statistics
 * - Status breakdown
 * - Monthly issuance
 * - Top courses
 * - Recent certificates
 *
 * ============================================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    /*
     * --------------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------------
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
     * --------------------------------------------------------
     * ADMIN AUTHORIZATION
     * --------------------------------------------------------
     */

    const role =
      String(
        (user as any).role || ""
      ).toUpperCase();

    const isAdmin =
      role === "ADMIN" ||
      role === "SUPER_ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        {
          status: 403,
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
     * CURRENT DATE
     * --------------------------------------------------------
 */

    const now =
      new Date();

    /*
     * --------------------------------------------------------
     * START OF CURRENT MONTH
     * --------------------------------------------------------
     */

    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    /*
     * --------------------------------------------------------
     * START OF PREVIOUS MONTH
     * --------------------------------------------------------
     */

    const startOfPreviousMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

    /*
     * --------------------------------------------------------
     * CERTIFICATE DEFINITION STATISTICS
     * --------------------------------------------------------
     */

    const [
      totalDefinitions,
      activeDefinitions,
      inactiveDefinitions,
    ] =
      await Promise.all([
        Certificate.countDocuments({}),

        Certificate.countDocuments({
          isActive: true,
        }),

        Certificate.countDocuments({
          $or: [
            {
              isActive: false,
            },
            {
              isActive: {
                $exists: false,
              },
            },
          ],
        }),
      ]);

    /*
     * --------------------------------------------------------
     * USER CERTIFICATE STATISTICS
     * --------------------------------------------------------
     */

    const [
      totalCertificates,
      issuedCertificates,
      pendingCertificates,
      revokedCertificates,
      expiredCertificates,
    ] =
      await Promise.all([
        UserCertificate.countDocuments({}),

        UserCertificate.countDocuments({
          status: "ISSUED",
        }),

        UserCertificate.countDocuments({
          status: "PENDING",
        }),

        UserCertificate.countDocuments({
          status: "REVOKED",
        }),

        UserCertificate.countDocuments({
          $or: [
            {
              status: "EXPIRED",
            },

            {
              status: "ISSUED",
              expiresAt: {
                $lt: now,
                $ne: null,
              },
            },
          ],
        }),
      ]);

    /*
     * --------------------------------------------------------
     * CURRENT MONTH ISSUANCE
     * --------------------------------------------------------
     */

    const issuedThisMonth =
      await UserCertificate.countDocuments(
        {
          status: "ISSUED",

          issuedAt: {
            $gte:
              startOfMonth,
          },
        }
      );

    /*
     * --------------------------------------------------------
     * PREVIOUS MONTH ISSUANCE
     * --------------------------------------------------------
     */

    const issuedPreviousMonth =
      await UserCertificate.countDocuments(
        {
          status: "ISSUED",

          issuedAt: {
            $gte:
              startOfPreviousMonth,

            $lt:
              startOfMonth,
          },
        }
      );

    /*
     * --------------------------------------------------------
     * MONTHLY GROWTH
     * --------------------------------------------------------
     */

    let monthlyGrowth = 0;

    if (
      issuedPreviousMonth ===
      0
    ) {
      monthlyGrowth =
        issuedThisMonth > 0
          ? 100
          : 0;
    } else {
      monthlyGrowth =
        Math.round(
          (
            (
              issuedThisMonth -
              issuedPreviousMonth
            ) /
            issuedPreviousMonth
          ) *
            100
        );
    }

    /*
     * --------------------------------------------------------
     * MONTHLY ISSUANCE DATA
     * --------------------------------------------------------
     *
     * Last 12 months.
     *
     * --------------------------------------------------------
     */

    const twelveMonthsAgo =
      new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1
      );

    const monthlyIssuance =
      await UserCertificate.aggregate(
        [
          {
            $match: {
              status: "ISSUED",

              issuedAt: {
                $gte:
                  twelveMonthsAgo,
              },
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$issuedAt",
                },

                month: {
                  $month:
                    "$issuedAt",
                },
              },

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
            },
          },
        ]
      );

    /*
     * --------------------------------------------------------
     * BUILD LAST 12 MONTHS
     * --------------------------------------------------------
     */

    const monthlyMap =
      new Map<
        string,
        number
      >();

    for (
      const item of monthlyIssuance
    ) {
      const key =
        `${item._id.year}-${String(
          item._id.month
        ).padStart(2, "0")}`;

      monthlyMap.set(
        key,
        Number(
          item.count || 0
        )
      );
    }

    const monthlyData: Array<{
      year: number;
      month: number;
      label: string;
      count: number;
    }> = [];

    for (
      let i = 11;
      i >= 0;
      i--
    ) {
      const date =
        new Date(
          now.getFullYear(),
          now.getMonth() - i,
          1
        );

      const year =
        date.getFullYear();

      const month =
        date.getMonth() + 1;

      const key =
        `${year}-${String(
          month
        ).padStart(2, "0")}`;

      const label =
        date.toLocaleDateString(
          "en-IN",
          {
            month: "short",
            year: "numeric",
          }
        );

      monthlyData.push({
        year,

        month,

        label,

        count:
          monthlyMap.get(
            key
          ) || 0,
      });
    }

    /*
     * --------------------------------------------------------
     * TOP COURSES
     * --------------------------------------------------------
     */

    const topCourses =
      await UserCertificate.aggregate(
        [
          {
            $match: {
              status: "ISSUED",
            },
          },

          {
            $group: {
              _id: "$course",

              issued: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              issued: -1,
            },
          },

          {
            $limit: 10,
          },

          {
            $lookup: {
              from: "courses",

              localField: "_id",

              foreignField: "_id",

              as: "course",
            },
          },

          {
            $unwind: {
              path: "$course",

              preserveNullAndEmptyArrays:
                true,
            },
          },

          {
            $project: {
              _id: 1,

              issued: 1,

              title:
                "$course.title",

              slug:
                "$course.slug",

              thumbnail:
                "$course.thumbnail",
            },
          },
        ]
      );

    /*
     * --------------------------------------------------------
     * FORMAT TOP COURSES
     * --------------------------------------------------------
     */

    const formattedTopCourses =
      topCourses.map(
        (item: any) => ({
          courseId:
            item._id
              ? String(
                  item._id
                )
              : null,

          title:
            item.title ||
            "Unknown Course",

          slug:
            item.slug || "",

          thumbnail:
            item.thumbnail ||
            "",

          issued:
            Number(
              item.issued || 0
            ),
        })
      );

    /*
     * --------------------------------------------------------
     * RECENT CERTIFICATES
     * --------------------------------------------------------
     */

    const recentCertificates =
      await UserCertificate.find(
        {}
      )
        .sort({
          issuedAt: -1,
          createdAt: -1,
        })
        .limit(10)
        .populate({
          path: "course",

          select:
            "_id title slug thumbnail",
        })
        .populate({
          path: "certificate",

          select:
            "_id title issuer issuerName",
        })
        .lean();

    /*
     * --------------------------------------------------------
     * FORMAT RECENT CERTIFICATES
     * --------------------------------------------------------
     */

    const formattedRecent =
      recentCertificates.map(
        (item: any) => {
          const course =
            item.course &&
            typeof item.course ===
              "object"
              ? item.course
              : null;

          const certificate =
            item.certificate &&
            typeof item.certificate ===
              "object"
              ? item.certificate
              : null;

          return {
            _id: String(
              item._id
            ),

            certificateNumber:
              item.certificateNumber ||
              "",

            status:
              item.status ||
              "PENDING",

            recipientName:
              item.metadata
                ?.userName ||
              "",

            course: course
              ? {
                  _id: String(
                    course._id
                  ),

                  title:
                    course.title ||
                    "",

                  slug:
                    course.slug ||
                    "",

                  thumbnail:
                    course.thumbnail ||
                    "",
                }
              : null,

            certificate:
              certificate
                ? {
                    _id: String(
                      certificate._id
                    ),

                    title:
                      certificate.title ||
                      "",

                    issuerName:
                      certificate.issuerName ||
                      certificate.issuer ||
                      "",
                  }
                : null,

            issuedAt:
              item.issuedAt ??
              null,

            expiresAt:
              item.expiresAt ??
              null,

            createdAt:
              item.createdAt,
          };
        }
      );

    /*
     * --------------------------------------------------------
     * COMPLETION / ISSUE RATE
     * --------------------------------------------------------
     */

    const issueRate =
      totalCertificates > 0
        ? Math.round(
            (
              issuedCertificates /
              totalCertificates
            ) *
              100
          )
        : 0;

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
 */

    return NextResponse.json({
      success: true,

      stats: {
        definitions: {
          total:
            totalDefinitions,

          active:
            activeDefinitions,

          inactive:
            inactiveDefinitions,
        },

        certificates: {
          total:
            totalCertificates,

          issued:
            issuedCertificates,

          pending:
            pendingCertificates,

          revoked:
            revokedCertificates,

          expired:
            expiredCertificates,

          issueRate,
        },

        monthly: {
          current:
            issuedThisMonth,

          previous:
            issuedPreviousMonth,

          growth:
            monthlyGrowth,

          data:
            monthlyData,
        },

        topCourses:
          formattedTopCourses,

        recent:
          formattedRecent,
      },
    });
  } catch (error) {
    /*
     * --------------------------------------------------------
     * ERROR
     * --------------------------------------------------------
     */

    console.error(
      "[ADMIN CERTIFICATE STATS] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load certificate statistics",
      },
      {
        status: 500,
      }
    );
  }
}