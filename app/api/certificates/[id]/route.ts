import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import UserCertificate from "@/models/UserCertificate";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ============================================================
 * GET USER CERTIFICATE
 * ============================================================
 *
 * GET
 * /api/certificates/[id]
 *
 * Returns one certificate belonging to the currently
 * authenticated user.
 *
 * ============================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
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
     * PARAMETER
     * --------------------------------------------------------
     */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * OBJECT ID VALIDATION
     * --------------------------------------------------------
     *
     * Prevent MongoDB CastError from reaching the database.
     *
     * --------------------------------------------------------
     */

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid certificate ID",
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
     * FETCH CERTIFICATE
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * We filter by both:
     *
     *   _id
     *   user
     *
     * This prevents one authenticated user from accessing
     * another user's certificate by changing the URL.
     *
     * --------------------------------------------------------
     */

    const certificate =
      await UserCertificate.findOne(
        {
          _id: id,

          user: user.id,
        }
      )
        .populate({
          path: "certificate",

          select:
            "_id title description template issuer issuerName issuerLogo validity validityDays requirements",
        })
        .populate({
          path: "course",

          select:
            "_id title slug thumbnail description",
        })
        .lean();

    /*
     * --------------------------------------------------------
     * NOT FOUND
     * --------------------------------------------------------
     */

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * EXPIRY CHECK
     * --------------------------------------------------------
     *
     * We calculate whether the certificate has expired.
     *
     * We don't immediately update the database here because
     * this GET endpoint should remain lightweight.
     *
     * The returned status becomes EXPIRED when the expiry date
     * has passed and the certificate isn't revoked.
     *
     * --------------------------------------------------------
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
        Date.now()
    ) {
      status = "EXPIRED";
    }

    /*
     * --------------------------------------------------------
     * VERIFICATION STATE
     * --------------------------------------------------------
     */

    const isValid =
      status === "ISSUED";

    /*
     * --------------------------------------------------------
     * BUILD COURSE RESPONSE
     * --------------------------------------------------------
     */

    const course =
      certificate.course &&
      typeof certificate.course ===
        "object"
        ? {
            _id: String(
              (certificate.course as any)
                ._id
            ),

            title:
              (certificate.course as any)
                .title || "",

            slug:
              (certificate.course as any)
                .slug || "",

            thumbnail:
              (certificate.course as any)
                .thumbnail || "",

            description:
              (certificate.course as any)
                .description || "",
          }
        : null;

    /*
     * --------------------------------------------------------
     * BUILD CERTIFICATE DEFINITION
     * --------------------------------------------------------
     */

    const certificateDefinition =
      certificate.certificate &&
      typeof certificate.certificate ===
        "object"
        ? {
            _id: String(
              (certificate.certificate as any)
                ._id
            ),

            title:
              (certificate.certificate as any)
                .title || "",

            description:
              (certificate.certificate as any)
                .description || "",

            template:
              (certificate.certificate as any)
                .template || "classic",

            issuer:
              (certificate.certificate as any)
                .issuer || "",

            issuerName:
              (certificate.certificate as any)
                .issuerName ||
              (certificate.certificate as any)
                .issuer ||
              "",

            issuerLogo:
              (certificate.certificate as any)
                .issuerLogo || "",

            validity:
              (certificate.certificate as any)
                .validity ||
              "PERMANENT",

            validityDays:
              (certificate.certificate as any)
                .validityDays ??
              null,

            requirements:
              (certificate.certificate as any)
                .requirements || {
                completionPercentage: 100,
                minimumScore: null,
                requireFinalAssessment:
                  false,
              },
          }
        : null;

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     *
     * We intentionally DO NOT return:
     *
     * - Mongo internal document fields
     * - User object
     * - Internal database information
     *
     * The verification code is returned because the user-side
     * certificate page may need it to construct a verification
     * URL.
     *
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      certificate: {
        _id: String(
          certificate._id
        ),

        certificateNumber:
          certificate.certificateNumber,

        verificationCode:
          certificate.verificationCode,

        status,

        isValid,

        issuedAt:
          certificate.issuedAt ??
          null,

        expiresAt:
          certificate.expiresAt ??
          null,

        revokedAt:
          certificate.revokedAt ??
          null,

        revokedReason:
          status === "REVOKED"
            ? certificate.revokedReason ||
              ""
            : "",

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

        course,

        certificateDefinition,

        metadata: {
          userName:
            certificate.metadata
              ?.userName || "",

          userEmail:
            certificate.metadata
              ?.userEmail || "",

          courseTitle:
            certificate.metadata
              ?.courseTitle ||
            course?.title ||
            "",

          certificateTitle:
            certificate.metadata
              ?.certificateTitle ||
            certificateDefinition?.title ||
            "",

          issuerName:
            certificate.metadata
              ?.issuerName ||
            certificateDefinition?.issuerName ||
            "",
        },

        createdAt:
          certificate.createdAt,

        updatedAt:
          certificate.updatedAt,
      },
    });
  } catch (error) {
    /*
     * --------------------------------------------------------
     * ERROR LOG
     * --------------------------------------------------------
     */

    console.error(
      "[USER CERTIFICATE] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load certificate",
      },
      {
        status: 500,
      }
    );
  }
}