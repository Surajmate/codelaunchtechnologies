import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Course from "@/models/Course";
import CourseEnrollment from "@/models/CourseEnrollment";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
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

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Course ID is required",
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
     */

    const course =
      await findCourse(id);

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: "Course not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * --------------------------------------------------
     * FIND ENROLLMENT
     * --------------------------------------------------
     */

    const enrollment =
      await CourseEnrollment.findOne(
        {
          user: user.id,
          course: course._id,
        }
      ).lean();

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not enrolled in this course",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * --------------------------------------------------
     * CHECK COMPLETION
     * --------------------------------------------------
     */

    const completed =
      enrollment.status ===
        "COMPLETED" ||
      Number(
        enrollment.progress || 0
      ) >= 100;

    if (!completed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Complete the course before downloading the certificate",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * CHECK CERTIFICATE
     * --------------------------------------------------
     */

    const certificate =
      enrollment.certificate as any;

    if (
      !certificate ||
      !certificate.issued ||
      !certificate.certificateId
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
     * --------------------------------------------------
     * CREATE PDF
     * --------------------------------------------------
     */

    const pdfBuffer =
      await generateCertificatePDF({
        learnerName:
          user.name ||
          "Learner",

        courseTitle:
          course.title ||
          "Course",

        certificateId:
          certificate.certificateId,

        completedAt:
          enrollment.completedAt ||
          certificate.issuedAt,

        issuedAt:
          certificate.issuedAt,

        category:
          course.category ||
          "",

        level:
          course.level ||
          "",
      });

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return new NextResponse(
      pdfBuffer as any,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `attachment; filename="certificate-${certificate.certificateId}.pdf"`,

          "Cache-Control":
            "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "[CERTIFICATE PDF] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to generate certificate PDF",

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
 * FIND COURSE
 * ======================================================
 */

async function findCourse(
  id: string
) {
  let course: any = null;

  /*
   * ObjectId lookup
   */

  if (
    isValidObjectId(id)
  ) {
    course =
      await Course.findOne({
        _id: id,

        status:
          "PUBLISHED",
      }).lean();
  }

  /*
   * Slug lookup
   */

  if (!course) {
    course =
      await Course.findOne({
        slug:
          id
            .trim()
            .toLowerCase(),

        status:
          "PUBLISHED",
      }).lean();
  }

  return course;
}

/*
 * ======================================================
 * GENERATE PDF
 * ======================================================
 */

interface CertificateData {
  learnerName: string;
  courseTitle: string;
  certificateId: string;
  completedAt: Date | string | null;
  issuedAt: Date | string | null;
  category: string;
  level: string;
}

async function generateCertificatePDF(
  data: CertificateData
): Promise<Buffer> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      try {
        const doc =
          new PDFDocument({
            size: "A4",
            layout: "landscape",
            margin: 0,
          });

        const chunks: Buffer[] =
          [];

        doc.on(
          "data",
          (chunk) => {
            chunks.push(
              Buffer.from(chunk)
            );
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

        const width =
          doc.page.width;

        const height =
          doc.page.height;

        /*
         * ------------------------------------------------
         * BACKGROUND
         * ------------------------------------------------
         */

        doc
          .rect(
            0,
            0,
            width,
            height
          )
          .fill("#0b0b0b");

        /*
         * ------------------------------------------------
         * OUTER BORDER
         * ------------------------------------------------
         */

        doc
          .lineWidth(2)
          .rect(
            28,
            28,
            width - 56,
            height - 56
          )
          .stroke("#ffffff");

        doc
          .lineWidth(1)
          .rect(
            42,
            42,
            width - 84,
            height - 84
          )
          .stroke("#555555");

        /*
         * ------------------------------------------------
         * BRAND
         * ------------------------------------------------
         */

        doc
          .fillColor("#ffffff")
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(
            "CODELAUNCH TECHNOLOGIES",
            0,
            70,
            {
              width,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * TITLE
         * ------------------------------------------------
         */

        doc
          .fillColor("#aaaaaa")
          .fontSize(12)
          .font("Helvetica")
          .text(
            "CERTIFICATE OF COMPLETION",
            0,
            112,
            {
              width,
              align: "center",
              characterSpacing: 2,
            }
          );

        /*
         * ------------------------------------------------
         * CHECK MARK
         * ------------------------------------------------
         */

        const circleX =
          width / 2;

        const circleY =
          165;

        doc
          .lineWidth(2)
          .circle(
            circleX,
            circleY,
            25
          )
          .stroke("#ffffff");

        doc
          .fillColor("#ffffff")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text(
            "✓",
            circleX - 10,
            circleY - 12,
            {
              width: 20,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * PRESENTED TO
         * ------------------------------------------------
         */

        doc
          .fillColor("#777777")
          .fontSize(10)
          .font("Helvetica")
          .text(
            "THIS CERTIFICATE IS PROUDLY PRESENTED TO",
            0,
            210,
            {
              width,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * LEARNER NAME
         * ------------------------------------------------
         */

        doc
          .fillColor("#ffffff")
          .fontSize(30)
          .font("Helvetica-Bold")
          .text(
            data.learnerName,
            80,
            240,
            {
              width:
                width - 160,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * DESCRIPTION
         * ------------------------------------------------
         */

        doc
          .fillColor("#999999")
          .fontSize(11)
          .font("Helvetica")
          .text(
            "has successfully completed the course",
            0,
            292,
            {
              width,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * COURSE TITLE
         * ------------------------------------------------
         */

        doc
          .fillColor("#ffffff")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text(
            data.courseTitle,
            80,
            320,
            {
              width:
                width - 160,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * COURSE META
         * ------------------------------------------------
         */

        const meta =
          [
            data.category,
            data.level,
          ]
            .filter(Boolean)
            .join("  •  ");

        if (meta) {
          doc
            .fillColor("#888888")
            .fontSize(10)
            .font("Helvetica")
            .text(
              meta,
              0,
              360,
              {
                width,
                align: "center",
              }
            );
        }

        /*
         * ------------------------------------------------
         * COMPLETION DATE
         * ------------------------------------------------
         */

        const completedDate =
          formatDate(
            data.completedAt
          );

        doc
          .fillColor("#777777")
          .fontSize(9)
          .font("Helvetica")
          .text(
            "COMPLETED",
            0,
            395,
            {
              width,
              align: "center",
            }
          );

        doc
          .fillColor("#ffffff")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            completedDate,
            0,
            410,
            {
              width,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * CERTIFICATE ID
         * ------------------------------------------------
         */

        doc
          .fillColor("#777777")
          .fontSize(8)
          .font("Helvetica")
          .text(
            "CERTIFICATE ID",
            0,
            450,
            {
              width,
              align: "center",
            }
          );

        doc
          .fillColor("#ffffff")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(
            data.certificateId,
            0,
            464,
            {
              width,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * ISSUED DATE
         * ------------------------------------------------
         */

        doc
          .fillColor("#777777")
          .fontSize(8)
          .font("Helvetica")
          .text(
            `Issued ${formatDate(
              data.issuedAt
            )}`,
            0,
            500,
            {
              width,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * FOOTER
         * ------------------------------------------------
         */

        doc
          .fillColor("#555555")
          .fontSize(7)
          .font("Helvetica")
          .text(
            "This certificate can be independently verified using the certificate ID.",
            0,
            height - 62,
            {
              width,
              align: "center",
            }
          );

        /*
         * ------------------------------------------------
         * FINALIZE
         * ------------------------------------------------
         */

        doc.end();
      } catch (error) {
        reject(error);
      }
    }
  );
}

/*
 * ======================================================
 * DATE FORMAT
 * ======================================================
 */

function formatDate(
  value:
    | Date
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

/*
 * ======================================================
 * OBJECT ID VALIDATION
 * ======================================================
 */

function isValidObjectId(
  value: string
) {
  return /^[a-fA-F0-9]{24}$/.test(
    value
  );
}