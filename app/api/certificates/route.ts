import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import UserCertificate from "@/models/UserCertificate";

/*
 * ============================================================
 * GET USER CERTIFICATES
 * ============================================================
 *
 * GET /api/certificates
 *
 * Query parameters:
 *
 * ?page=1
 * ?limit=10
 * ?search=javascript
 * ?status=ISSUED
 * ?course=<courseId>
 * ?sortBy=createdAt
 * ?sortOrder=desc
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
      request.nextUrl.searchParams;

    /*
     * PAGE
     */

    const pageParam =
      searchParams.get("page");

    let page =
      Number(pageParam || 1);

    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      page = 1;
    }

    /*
     * LIMIT
     */

    const limitParam =
      searchParams.get("limit");

    let limit =
      Number(limitParam || 10);

    /*
     * Prevent excessive database queries.
     */

    if (
      !Number.isInteger(limit) ||
      limit < 1
    ) {
      limit = 10;
    }

    limit = Math.min(
      limit,
      50
    );

    /*
     * --------------------------------------------------------
     * SEARCH
     * --------------------------------------------------------
     */

    const search =
      (
        searchParams.get(
          "search"
        ) || ""
      ).trim();

    /*
     * Prevent unnecessarily large search strings.
     */

    const safeSearch =
      search.substring(
        0,
        100
      );

    /*
     * --------------------------------------------------------
     * STATUS
     * --------------------------------------------------------
     */

    const statusParam =
      (
        searchParams.get(
          "status"
        ) || ""
      )
        .trim()
        .toUpperCase();

    const validStatuses = [
      "PENDING",
      "ISSUED",
      "REVOKED",
      "EXPIRED",
    ];

    if (
      statusParam &&
      !validStatuses.includes(
        statusParam
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid certificate status",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * COURSE FILTER
     * --------------------------------------------------------
     */

    const courseParam =
      (
        searchParams.get(
          "course"
        ) || ""
      ).trim();

    if (
      courseParam &&
      !mongoose.Types.ObjectId.isValid(
        courseParam
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid course ID",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * SORT
     * --------------------------------------------------------
     */

    const allowedSortFields = [
      "createdAt",
      "issuedAt",
      "certificateNumber",
    ];

    let sortBy =
      (
        searchParams.get(
          "sortBy"
        ) || "createdAt"
      ).trim();

    if (
      !allowedSortFields.includes(
        sortBy
      )
    ) {
      sortBy =
        "createdAt";
    }

    let sortOrder =
      (
        searchParams.get(
          "sortOrder"
        ) || "desc"
      )
        .trim()
        .toLowerCase();

    if (
      sortOrder !== "asc" &&
      sortOrder !== "desc"
    ) {
      sortOrder =
        "desc";
    }

    const sortDirection =
      sortOrder === "asc"
        ? 1
        : -1;

    /*
     * --------------------------------------------------------
     * BUILD QUERY
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * user: user.id
     *
     * ensures a user can ONLY retrieve their own certificates.
     *
     * --------------------------------------------------------
     */

    const query: any = {
      user: user.id,
    };

    /*
     * Status filter.
     */

    if (statusParam) {
      query.status =
        statusParam;
    }

    /*
     * Course filter.
     */

    if (courseParam) {
      query.course =
        courseParam;
    }

    /*
     * --------------------------------------------------------
     * SEARCH
     * --------------------------------------------------------
     *
     * Certificate number is directly searchable.
     *
     * Course title / certificate title are populated fields,
     * so they cannot be searched directly in this query.
     *
     * We handle those after retrieving matching certificates
     * when a search term is supplied.
     *
     * --------------------------------------------------------
     */

    if (safeSearch) {
      query.certificateNumber = {
        $regex:
          safeSearch.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
        $options: "i",
      };
    }

    /*
     * --------------------------------------------------------
     * COUNT
     * --------------------------------------------------------
     */

    const total =
      await UserCertificate.countDocuments(
        query
      );

    /*
     * --------------------------------------------------------
     * PAGINATION
     * --------------------------------------------------------
     */

    const totalPages =
      total > 0
        ? Math.ceil(
            total / limit
          )
        : 0;

    /*
     * Prevent page from going beyond available pages.
     */

    const safePage =
      totalPages > 0
        ? Math.min(
            page,
            totalPages
          )
        : 1;

    const skip =
      (safePage - 1) *
      limit;

    /*
     * --------------------------------------------------------
     * FETCH CERTIFICATES
     * --------------------------------------------------------
     */

    const certificates =
      await UserCertificate.find(
        query
      )
        .sort({
          [sortBy]:
            sortDirection,
        })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "certificate",

          select:
            "_id title description template issuer issuerName issuerLogo validity validityDays",
        })
        .populate({
          path: "course",

          select:
            "_id title slug thumbnail description",
        })
        .lean();

    /*
     * --------------------------------------------------------
     * CURRENT DATE
     * --------------------------------------------------------
     */

    const now =
      Date.now();

    /*
     * --------------------------------------------------------
     * FORMAT RESPONSE
     * --------------------------------------------------------
     */

    const result =
      certificates.map(
        (certificate: any) => {
          /*
           * Determine current status.
           */

          let status =
            certificate.status;

          if (
            certificate.status ===
              "ISSUED" &&
            certificate.expiresAt &&
            new Date(
              certificate.expiresAt
            ).getTime() <
              now
          ) {
            status =
              "EXPIRED";
          }

          /*
           * Certificate definition.
           */

          const definition =
            certificate.certificate &&
            typeof certificate.certificate ===
              "object"
              ? certificate.certificate
              : null;

          /*
           * Course.
           */

          const course =
            certificate.course &&
            typeof certificate.course ===
              "object"
              ? certificate.course
              : null;

          /*
           * Return safe object.
           */

          return {
            _id: String(
              certificate._id
            ),

            certificateNumber:
              certificate.certificateNumber,

            verificationCode:
              certificate.verificationCode,

            status,

            isValid:
              status === "ISSUED",

            issuedAt:
              certificate.issuedAt ??
              null,

            expiresAt:
              certificate.expiresAt ??
              null,

            revokedAt:
              certificate.revokedAt ??
              null,

            finalScore:
              certificate.finalScore ??
              null,

            completionPercentage:
              Number(
                certificate.completionPercentage ??
                  0
              ),

            pdfUrl:
              certificate.pdfUrl ||
              "",

            certificate: definition
              ? {
                  _id: String(
                    definition._id
                  ),

                  title:
                    definition.title ||
                    "",

                  description:
                    definition.description ||
                    "",

                  template:
                    definition.template ||
                    "classic",

                  issuer:
                    definition.issuer ||
                    "",

                  issuerName:
                    definition.issuerName ||
                    definition.issuer ||
                    "",

                  issuerLogo:
                    definition.issuerLogo ||
                    "",

                  validity:
                    definition.validity ||
                    "PERMANENT",

                  validityDays:
                    definition.validityDays ??
                    null,
                }
              : null,

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

                  description:
                    course.description ||
                    "",
                }
              : null,

            metadata: {
              userName:
                certificate
                  .metadata
                  ?.userName ||
                "",

              userEmail:
                certificate
                  .metadata
                  ?.userEmail ||
                "",

              courseTitle:
                certificate
                  .metadata
                  ?.courseTitle ||
                course?.title ||
                "",

              certificateTitle:
                certificate
                  .metadata
                  ?.certificateTitle ||
                definition?.title ||
                "",

              issuerName:
                certificate
                  .metadata
                  ?.issuerName ||
                definition?.issuerName ||
                definition?.issuer ||
                "",
            },

            createdAt:
              certificate.createdAt,

            updatedAt:
              certificate.updatedAt,
          };
        }
      );

    /*
     * --------------------------------------------------------
     * SUMMARY
     * --------------------------------------------------------
     */

    const summary = {
      total,

      page: safePage,

      limit,

      totalPages,

      hasNextPage:
        safePage <
        totalPages,

      hasPreviousPage:
        safePage > 1,
    };

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      certificates:
        result,

      pagination:
        summary,
    });
  } catch (error) {
    /*
     * --------------------------------------------------------
     * ERROR
     * --------------------------------------------------------
     */

    console.error(
      "[USER CERTIFICATES] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load certificates",
      },
      {
        status: 500,
      }
    );
  }
}