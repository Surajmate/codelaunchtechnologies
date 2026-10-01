import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import UserCertificate from "@/models/UserCertificate";
import Certificate from "@/models/Certificate";

import Course from "@/models/Course";

void Certificate;
void Course;

/*
 * ============================================================
 * PUBLIC CERTIFICATE VERIFICATION
 * ============================================================
 *
 * GET
 * /api/certificates/verify
 *
 * Supported:
 *
 * ?certificateNumber=CLT-2026-000001
 *
 * OR
 *
 * ?verificationCode=xxxxxxxxxxxxxxxx
 *
 * No authentication required.
 *
 * ============================================================
 */

/*
 * Explicitly reference the Certificate model so that
 * Mongoose registers the "Certificate" model before
 * UserCertificate.populate() is executed.
 *
 * This is intentionally kept here because UserCertificate
 * contains a reference to the Certificate model.
 */
void Certificate;

export async function GET(request: NextRequest) {
  try {
    /*
     * --------------------------------------------------------
     * READ QUERY PARAMETERS
     * --------------------------------------------------------
     */

    const searchParams = request.nextUrl.searchParams;

    const certificateNumber = (
      searchParams.get("certificateNumber") || ""
    ).trim();

    const verificationCode = (
      searchParams.get("verificationCode") || ""
    ).trim();

    /*
     * --------------------------------------------------------
     * VALIDATION
     * --------------------------------------------------------
     */

    if (!certificateNumber && !verificationCode) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message:
            "Certificate number or verification code is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Prevent unnecessarily large input.
     */

    if (certificateNumber.length > 100) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "Invalid certificate number",
        },
        {
          status: 400,
        }
      );
    }

    if (verificationCode.length > 200) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "Invalid verification code",
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
     * BUILD QUERY
     * --------------------------------------------------------
     *
     * Certificate number takes priority if both values
     * are supplied.
     *
     * --------------------------------------------------------
     */

    const query = certificateNumber
      ? {
          certificateNumber: certificateNumber.toUpperCase(),
        }
      : {
          verificationCode,
        };

    /*
     * --------------------------------------------------------
     * FIND CERTIFICATE
     * --------------------------------------------------------
     *
     * Certificate is explicitly imported above so that the
     * Certificate model is registered before populate().
     *
     * --------------------------------------------------------
     */

    const certificate = await UserCertificate.findOne(query)
      .populate({
        path: "certificate",
        select:
          "_id title description issuer issuerName issuerLogo template validity",
      })
      .populate({
        path: "course",
        select: "_id title slug thumbnail",
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
          success: true,
          valid: false,
          message: "Certificate could not be verified",
        },
        {
          status: 200,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DETERMINE STATUS
     * --------------------------------------------------------
     */

    let status = certificate.status;

    /*
     * Check expiry.
     */

    const isExpired =
      certificate.expiresAt &&
      new Date(certificate.expiresAt).getTime() < Date.now();

    if (certificate.status === "ISSUED" && isExpired) {
      status = "EXPIRED";
    }

    /*
     * --------------------------------------------------------
     * VALIDITY
     * --------------------------------------------------------
     *
     * Only an issued and non-expired certificate is valid.
     *
     * --------------------------------------------------------
     */

    const valid = status === "ISSUED";

    /*
     * --------------------------------------------------------
     * POPULATED DATA
     * --------------------------------------------------------
     */

    const certificateDefinition =
      certificate.certificate &&
      typeof certificate.certificate === "object"
        ? (certificate.certificate as Record<string, any>)
        : null;

    const course =
      certificate.course &&
      typeof certificate.course === "object"
        ? (certificate.course as Record<string, any>)
        : null;

    /*
     * --------------------------------------------------------
     * USER INFORMATION
     * --------------------------------------------------------
     *
     * Use the snapshot stored at the time the certificate
     * was issued.
     *
     * We intentionally don't expose:
     *
     * - user ID
     * - email
     * - phone
     * - address
     * - internal database information
     *
     * --------------------------------------------------------
     */

    const metadata =
      certificate.metadata &&
      typeof certificate.metadata === "object"
        ? (certificate.metadata as Record<string, any>)
        : {};

    const userName = metadata.userName || "";

    /*
     * --------------------------------------------------------
     * CERTIFICATE INFORMATION
     * --------------------------------------------------------
     */

    const certificateTitle =
      metadata.certificateTitle ||
      certificateDefinition?.title ||
      "Certificate";

    const courseTitle =
      metadata.courseTitle ||
      course?.title ||
      "";

    const issuerName =
      metadata.issuerName ||
      certificateDefinition?.issuerName ||
      certificateDefinition?.issuer ||
      "";

    const issuerLogo =
      metadata.issuerLogo ||
      certificateDefinition?.issuerLogo ||
      "";

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     *
     * Public verification response.
     *
     * We intentionally don't expose:
     *
     * - User ID
     * - Email
     * - Phone
     * - Internal MongoDB IDs
     * - Private metadata
     * - PDF storage information
     * - Revocation internals
     *
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      valid,

      message: valid
        ? "Certificate is valid"
        : status === "REVOKED"
        ? "Certificate has been revoked"
        : status === "EXPIRED"
        ? "Certificate has expired"
        : status === "PENDING"
        ? "Certificate has not been issued"
        : "Certificate is not valid",

      certificate: {
        certificateNumber:
          certificate.certificateNumber,

        certificateTitle,

        recipientName: userName,

        courseTitle,

        issuerName,

        issuerLogo,

        issuedAt:
          certificate.issuedAt ?? null,

        expiresAt:
          certificate.expiresAt ?? null,

        status,

        completionPercentage: Number(
          certificate.completionPercentage ?? 0
        ),

        /*
         * Kept in the API for backward compatibility.
         *
         * Your public verification UI should NOT display this.
         */
        finalScore:
          certificate.finalScore ?? null,

        /*
         * Kept in the API for backward compatibility.
         *
         * Your public verification UI should NOT display this.
         */
        template:
          certificateDefinition?.template ||
          "classic",
      },
    });
  } catch (error) {
    /*
     * --------------------------------------------------------
     * ERROR
     * --------------------------------------------------------
     */

    console.error(
      "[PUBLIC CERTIFICATE VERIFICATION] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: "Unable to verify certificate",
      },
      {
        status: 500,
      }
    );
  }
}