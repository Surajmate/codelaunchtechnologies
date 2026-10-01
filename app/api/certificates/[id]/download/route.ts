import { NextResponse } from "next/server";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

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
 * HELPERS
 * ============================================================
 */

function formatDate(
  value?: Date | string | null
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }
  );
}

function sanitizeFileName(
  value: string
): string {
  return value
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 100);
}

function safeText(
  value: unknown,
  fallback = ""
): string {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  return value.trim() || fallback;
}

/*
 * ============================================================
 * GET /api/certificates/[id]/download
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
     * Ownership is checked directly in the query.
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
            "_id title description template issuer issuerName issuerLogo validity validityDays",
        })
        .populate({
          path: "course",

          select:
            "_id title slug thumbnail",
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
     * STATUS VALIDATION
     * --------------------------------------------------------
     */

    if (
      certificate.status ===
      "PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Certificate has not been issued yet",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * REVOKED
     * --------------------------------------------------------
     */

    if (
      certificate.status ===
      "REVOKED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This certificate has been revoked",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * EXPIRY
     * --------------------------------------------------------
     */

    if (
      certificate.expiresAt &&
      new Date(
        certificate.expiresAt
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This certificate has expired",
        },
        {
          status: 410,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * EXTRACT DATA
     * --------------------------------------------------------
     */

    const certificateDefinition =
      certificate.certificate &&
      typeof certificate.certificate ===
        "object"
        ? (certificate.certificate as any)
        : null;

    const course =
      certificate.course &&
      typeof certificate.course ===
        "object"
        ? (certificate.course as any)
        : null;

    /*
     * --------------------------------------------------------
     * SNAPSHOT DATA
     * --------------------------------------------------------
     *
     * Prefer metadata because it represents what existed
     * at the time the certificate was issued.
     *
     * --------------------------------------------------------
     */

    const recipientName =
      safeText(
        certificate.metadata
          ?.userName,
        safeText(
          (user as any).name,
          "Certificate Holder"
        )
      );

    const recipientEmail =
      safeText(
        certificate.metadata
          ?.userEmail,
        safeText(
          (user as any).email
        )
      );

    const courseTitle =
      safeText(
        certificate.metadata
          ?.courseTitle,
        safeText(
          course?.title,
          "Course Completion"
        )
      );

    const certificateTitle =
      safeText(
        certificate.metadata
          ?.certificateTitle,
        safeText(
          certificateDefinition?.title,
          "Certificate of Completion"
        )
      );

    const issuerName =
      safeText(
        certificate.metadata
          ?.issuerName,
        safeText(
          certificateDefinition?.issuerName,
          safeText(
            certificateDefinition?.issuer,
            "Codelaunch Technologies"
          )
        )
      );

    /*
     * --------------------------------------------------------
     * VERIFICATION URL
     * --------------------------------------------------------
     *
     * We use the public verification page.
     *
     * NEXT_PUBLIC_APP_URL should contain something like:
     *
     * https://yourdomain.com
     *
     * --------------------------------------------------------
     */

    const requestUrl =
      new URL(request.url);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${requestUrl.protocol}//${requestUrl.host}`;

    const verificationUrl =
      `${appUrl}/certificate/verify/${encodeURIComponent(
        certificate.certificateNumber
      )}`;

    /*
     * --------------------------------------------------------
     * QR CODE
     * --------------------------------------------------------
     */

    const qrDataUrl =
      await QRCode.toDataURL(
        verificationUrl,
        {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 180,
        }
      );

    /*
     * Convert data URL into Buffer.
     */

    const qrBase64 =
      qrDataUrl.replace(
        /^data:image\/png;base64,/,
        ""
      );

    const qrBuffer =
      Buffer.from(
        qrBase64,
        "base64"
      );

    /*
     * --------------------------------------------------------
     * CREATE PDF
     * --------------------------------------------------------
     */

    const doc =
      new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        info: {
          Title:
            certificateTitle,

          Author:
            issuerName,

          Subject:
            `Certificate ${certificate.certificateNumber}`,

          Keywords:
            "certificate, completion, verification",
        },
      });

    /*
     * --------------------------------------------------------
     * COLLECT PDF STREAM
     * --------------------------------------------------------
     */

    const chunks: Buffer[] = [];

    doc.on(
      "data",
      (chunk: Buffer) => {
        chunks.push(chunk);
      }
    );

    /*
     * --------------------------------------------------------
     * PAGE DIMENSIONS
     * --------------------------------------------------------
     */

    const pageWidth =
      doc.page.width;

    const pageHeight =
      doc.page.height;

    /*
     * --------------------------------------------------------
     * OUTER BORDER
     * --------------------------------------------------------
     */

    doc
      .lineWidth(3)
      .rect(
        28,
        28,
        pageWidth - 56,
        pageHeight - 56
      )
      .stroke();

    doc
      .lineWidth(1)
      .rect(
        38,
        38,
        pageWidth - 76,
        pageHeight - 76
      )
      .stroke();

    /*
     * --------------------------------------------------------
     * HEADER
     * --------------------------------------------------------
     */

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(
        certificateDefinition.issuer.toUpperCase(),
        0,
        70,
        {
          align: "center",
          width: pageWidth,
        }
      );

    /*
     * --------------------------------------------------------
     * CERTIFICATE
     * --------------------------------------------------------
     */

    doc
      .font("Helvetica-Bold")
      .fontSize(34)
      .text(
        "CERTIFICATE",
        0,
        110,
        {
          align: "center",
          width: pageWidth,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(16)
      .text(
        "OF COMPLETION",
        0,
        150,
        {
          align: "center",
          width: pageWidth,
        }
      );

    /*
     * --------------------------------------------------------
     * PRESENTED TO
     * --------------------------------------------------------
     */

    doc
      .font("Helvetica")
      .fontSize(13)
      .text(
        "This certificate is proudly presented to",
        0,
        195,
        {
          align: "center",
          width: pageWidth,
        }
      );

    /*
     * --------------------------------------------------------
     * USER NAME
     * --------------------------------------------------------
     */

    doc
      .font("Helvetica-Bold")
      .fontSize(30)
      .text(
        recipientName,
        0,
        225,
        {
          align: "center",
          width: pageWidth,
        }
      );

    /*
     * --------------------------------------------------------
     * COURSE TEXT
     * --------------------------------------------------------
     */

    doc
      .font("Helvetica")
      .fontSize(13)
      .text(
        "for successfully completing",
        0,
        275,
        {
          align: "center",
          width: pageWidth,
        }
      );

    /*
     * --------------------------------------------------------
     * COURSE TITLE
     * --------------------------------------------------------
     */

    doc
      .font("Helvetica-Bold")
      .fontSize(23)
      .text(
        courseTitle,
        100,
        302,
        {
          align: "center",
          width:
            pageWidth - 200,
        }
      );

    /*
     * --------------------------------------------------------
     * CERTIFICATE TITLE
     * --------------------------------------------------------
     */

    if (
      certificateTitle &&
      certificateTitle !==
        courseTitle
    ) {
      doc
        .font("Helvetica")
        .fontSize(12)
        .text(
          certificateTitle,
          100,
          340,
          {
            align: "center",
            width:
              pageWidth - 200,
          }
        );
    }

    /*
     * --------------------------------------------------------
     * COMPLETION
     * --------------------------------------------------------
     */

    const completion =
      Math.round(
        Number(
          certificate.completionPercentage ||
            0
        )
      );

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(
        `Course Completion: ${completion}%`,
        0,
        375,
        {
          align: "center",
          width: pageWidth,
        }
      );

    /*
     * --------------------------------------------------------
     * SCORE
     * --------------------------------------------------------
     */

    if (
      certificate.finalScore !==
        null &&
      certificate.finalScore !==
        undefined
    ) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .text(
          `Final Score: ${Number(
            certificate.finalScore
          )}%`,
          0,
          395,
          {
            align: "center",
            width: pageWidth,
          }
        );
    }

    /*
     * --------------------------------------------------------
     * CERTIFICATE INFORMATION
     * --------------------------------------------------------
     */

    const infoY =
      pageHeight - 125;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(
        "CERTIFICATE NUMBER",
        75,
        infoY
      );

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        certificate.certificateNumber,
        75,
        infoY + 15
      );

    /*
     * ISSUE DATE
     */

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(
        "ISSUED",
        285,
        infoY
      );

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        formatDate(
          certificate.issuedAt
        ),
        285,
        infoY + 15
      );

    /*
     * EXPIRY DATE
     */

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(
        "VALIDITY",
        425,
        infoY
      );

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        certificate.expiresAt
          ? `Until ${formatDate(
              certificate.expiresAt
            )}`
          : "Permanent",
        425,
        infoY + 15
      );

    /*
     * --------------------------------------------------------
     * QR CODE
     * --------------------------------------------------------
     */

    doc.image(
      qrBuffer,
      pageWidth - 180,
      pageHeight - 180,
      {
        width: 90,
        height: 90,
      }
    );

    doc
      .font("Helvetica")
      .fontSize(7)
      .text(
        "Scan to verify",
        pageWidth - 185,
        pageHeight - 82,
        {
          width: 100,
          align: "center",
        }
      );

    /*
     * --------------------------------------------------------
     * FOOTER
     * --------------------------------------------------------
     */

    doc
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This certificate can be independently verified using the certificate number or QR code.",
        60,
        pageHeight - 62,
        {
          width:
            pageWidth - 250,
          align: "left",
        }
      );

    /*
     * --------------------------------------------------------
     * FINALIZE PDF
     * --------------------------------------------------------
     */

    doc.end();

    /*
     * --------------------------------------------------------
     * WAIT FOR PDF
     * --------------------------------------------------------
     */

    const pdfBuffer =
      await new Promise<Buffer>(
        (
          resolve,
          reject
        ) => {
          const chunks: Buffer[] =
            [];

          doc.on(
            "data",
            (chunk: Buffer) => {
              chunks.push(chunk);
            }
          );

          doc.on(
            "end",
            () => {
              resolve(
                Buffer.concat(
                  chunks
                )
              );
            }
          );

          doc.on(
            "error",
            reject
          );
        }
      );

    /*
     * --------------------------------------------------------
     * FILE NAME
     * --------------------------------------------------------
     */

    const safeName =
      sanitizeFileName(
        recipientName
      ) ||
      "Certificate";

    const fileName =
      `${safeName}-${certificate.certificateNumber}.pdf`;

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="${fileName}"`,

          "Content-Length":
            String(
              pdfBuffer.length
            ),

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "[USER CERTIFICATE] DOWNLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate certificate",
      },
      {
        status: 500,
      }
    );
  }
}