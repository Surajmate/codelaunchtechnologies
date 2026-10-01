import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Certificate from "@/models/Certificate";
import UserCertificate from "@/models/UserCertificate";

/*
 * ============================================================
 * ADMIN CERTIFICATE DETAILS
 * ============================================================
 *
 * GET
 * /api/admin/certificates/:id
 *
 * PATCH
 * /api/admin/certificates/:id
 *
 * DELETE
 * /api/admin/certificates/:id
 *
 * ============================================================
 */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
 * ============================================================
 * ADMIN AUTHENTICATION
 * ============================================================
 */

async function authorizeAdmin() {
  const user =
    await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      response:
        NextResponse.json(
          {
            success: false,
            message:
              "Unauthorized",
          },
          {
            status: 401,
          }
        ),
    };
  }

  const role =
    String(
      (user as any).role || ""
    ).toUpperCase();

  const isAdmin =
    role === "ADMIN" ||
    role === "SUPER_ADMIN";

  if (!isAdmin) {
    return {
      authorized: false,
      response:
        NextResponse.json(
          {
            success: false,
            message:
              "Forbidden",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/*
 * ============================================================
 * VALIDATE OBJECT ID
 * ============================================================
 */

function isValidObjectId(
  id: string
) {
  return mongoose.Types.ObjectId.isValid(
    id
  );
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Get one certificate definition together with:
 *
 * - course
 * - issuance statistics
 * - actual issued certificate records
 *
 * ============================================================
 */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    const auth =
      await authorizeAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    /*
     * --------------------------------------------------------
     * PARAMS
     * --------------------------------------------------------
     */

    const { id } =
      await context.params;

    if (
      !isValidObjectId(id)
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
     * FETCH CERTIFICATE DEFINITION
     * --------------------------------------------------------
     */

    const certificate =
      await Certificate.findById(
        id
      )
        .populate({
          path: "course",
          select:
            "_id title slug thumbnail description",
        })
        .lean();

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
     * ISSUANCE STATISTICS
     * --------------------------------------------------------
     */

    const [
      totalIssued,
      issued,
      pending,
      revoked,
      expired,
    ] =
      await Promise.all([
        UserCertificate.countDocuments(
          {
            certificate:
              certificate._id,
          }
        ),

        UserCertificate.countDocuments(
          {
            certificate:
              certificate._id,

            status:
              "ISSUED",
          }
        ),

        UserCertificate.countDocuments(
          {
            certificate:
              certificate._id,

            status:
              "PENDING",
          }
        ),

        UserCertificate.countDocuments(
          {
            certificate:
              certificate._id,

            status:
              "REVOKED",
          }
        ),

        UserCertificate.countDocuments(
          {
            certificate:
              certificate._id,

            $or: [
              {
                status:
                  "EXPIRED",
              },

              {
                status:
                  "ISSUED",

                expiresAt: {
                  $lt:
                    new Date(),

                  $ne:
                    null,
                },
              },
            ],
          }
        ),
      ]);

    /*
     * --------------------------------------------------------
     * FETCH ACTUAL USER CERTIFICATE RECORDS
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * UserCertificate.certificate references
     * Certificate._id.
     *
     * This was missing from the previous GET response.
     * --------------------------------------------------------
     */

    const issuedCertificateRecords =
      await UserCertificate.find(
        {
          certificate:
            certificate._id,
        }
      )
        .sort({
          createdAt:
            -1,
        })
        .populate({
          path: "user",
          select:
            "_id name email avatar role isActive",
        })
        .populate({
          path: "course",
          select:
            "_id title slug thumbnail description",
        })
        .lean();

    console.log(
      "[ADMIN CERTIFICATE GET] Certificate:",
      id
    );

    console.log(
      "[ADMIN CERTIFICATE GET] Total issued:",
      totalIssued
    );

    console.log(
      "[ADMIN CERTIFICATE GET] Records found:",
      issuedCertificateRecords.length
    );

    /*
     * --------------------------------------------------------
     * FORMAT COURSE
     * --------------------------------------------------------
     */

    const course =
      (certificate as any)
        .course;

    /*
     * --------------------------------------------------------
     * FORMAT ISSUED CERTIFICATES
     * --------------------------------------------------------
     */

    const issuedCertificates =
      issuedCertificateRecords.map(
        (item: any) => ({
          _id:
            String(
              item._id
            ),

          certificate:
            item.certificate
              ? String(
                  item.certificate
                )
              : id,

          course:
            item.course
              ? {
                  _id:
                    String(
                      item.course._id
                    ),

                  title:
                    item.course.title ||
                    "",

                  slug:
                    item.course.slug ||
                    "",

                  thumbnail:
                    item.course.thumbnail ||
                    "",

                  description:
                    item.course.description ||
                    "",
                }
              : null,

          user:
            item.user
              ? {
                  _id:
                    String(
                      item.user._id
                    ),

                  name:
                    item.user.name ||
                    "",

                  email:
                    item.user.email ||
                    "",

                  avatar:
                    item.user.avatar ||
                    "",

                  role:
                    item.user.role ||
                    "USER",

                  isActive:
                    item.user
                      .isActive !==
                    false,
                }
              : null,

          certificateNumber:
            item.certificateNumber ||
            "",

          verificationCode:
            item.verificationCode ||
            "",

          status:
            item.status ||
            "PENDING",

          issuedAt:
            item.issuedAt
              ? new Date(
                  item.issuedAt
                ).toISOString()
              : null,

          expiresAt:
            item.expiresAt
              ? new Date(
                  item.expiresAt
                ).toISOString()
              : null,

          revokedAt:
            item.revokedAt
              ? new Date(
                  item.revokedAt
                ).toISOString()
              : null,

          revokedReason:
            item.revokedReason ||
            "",

          finalScore:
            item.finalScore ??
            null,

          completionPercentage:
            item.completionPercentage ??
            0,

          pdfUrl:
            item.pdfUrl ||
            "",

          metadata:
            item.metadata ||
            {},

          createdAt:
            item.createdAt
              ? new Date(
                  item.createdAt
                ).toISOString()
              : null,

          updatedAt:
            item.updatedAt
              ? new Date(
                  item.updatedAt
                ).toISOString()
              : null,
        })
      );

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      certificate: {
        _id:
          String(
            certificate._id
          ),

        title:
          (certificate as any)
            .title ||
          "",

        description:
          (certificate as any)
            .description ||
          "",

        issuer:
          (certificate as any)
            .issuer ||
          "",

        issuerName:
          (certificate as any)
            .issuerName ||
          (certificate as any)
            .issuer ||
          "",

        issuerLogo:
          (certificate as any)
            .issuerLogo ||
          "",

        template:
          (certificate as any)
            .template ||
          "classic",

        validity:
          (certificate as any)
            .validity ||
          "PERMANENT",

        validityDays:
          (certificate as any)
            .validityDays ??
          null,

        status:
          (certificate as any)
            .status ||
          "ACTIVE",

        isActive:
          (certificate as any)
            .isActive ===
          true,

        requirements:
          (certificate as any)
            .requirements || {
            completionPercentage:
              100,

            minimumScore:
              null,

            requireFinalAssessment:
              false,
          },

        course:
          course
            ? {
                _id:
                  String(
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

        /*
         * Existing statistics.
         */

        statistics: {
          total:
            totalIssued,

          issued,

          pending,

          revoked,

          expired,
        },

        /*
         * NEW:
         * Actual user certificate records.
         */

        issuedCertificates,

        /*
         * Useful count for the UI.
         */

        issuedCertificateCount:
          issuedCertificates.length,

        createdAt:
          certificate.createdAt,

        updatedAt:
          certificate.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN CERTIFICATE GET] ERROR:",
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

/*
 * ============================================================
 * PATCH
 * ============================================================
 *
 * Update certificate definition.
 *
 * ============================================================
 */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    const auth =
      await authorizeAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    /*
     * --------------------------------------------------------
     * PARAMS
     * --------------------------------------------------------
     */

    const { id } =
      await context.params;

    if (
      !isValidObjectId(id)
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
            "Invalid JSON request body",
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
     * EXISTING CERTIFICATE
     * --------------------------------------------------------
     */

    const existing =
      await Certificate.findById(
        id
      );

    if (!existing) {
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
     * ALLOWED FIELDS
     * --------------------------------------------------------
     */

    const allowedFields = [
      "title",
      "description",
      "issuer",
      "issuerName",
      "issuerLogo",
      "template",
      "validity",
      "validityDays",
      "status",
      "isActive",
      "requirements",
      "course",
    ];

    /*
     * --------------------------------------------------------
     * PREVENT UNKNOWN FIELDS
     * --------------------------------------------------------
     */

    const receivedFields =
      Object.keys(
        body || {}
      );

    const invalidFields =
      receivedFields.filter(
        (field) =>
          !allowedFields.includes(
            field
          )
      );

    if (
      invalidFields.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid fields in request",

          fields:
            invalidFields,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * TITLE
     * --------------------------------------------------------
     */

    if (
      body.title !==
      undefined
    ) {
      if (
        typeof body.title !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Title must be a string",
          },
          {
            status: 400,
          }
        );
      }

      const title =
        body.title.trim();

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Title is required",
          },
          {
            status: 400,
          }
        );
      }

      if (
        title.length >
        200
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Title cannot exceed 200 characters",
          },
          {
            status: 400,
          }
        );
      }

      existing.title =
        title;
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
      if (
        typeof body.description !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Description must be a string",
          },
          {
            status: 400,
          }
        );
      }

      if (
        body.description.length >
        2000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Description cannot exceed 2000 characters",
          },
          {
            status: 400,
          }
        );
      }

      existing.description =
        body.description.trim();
    }

    /*
     * --------------------------------------------------------
     * ISSUER
     * --------------------------------------------------------
     */

    if (
      body.issuer !==
      undefined
    ) {
      if (
        typeof body.issuer !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issuer must be a string",
          },
          {
            status: 400,
          }
        );
      }

      const issuer =
        body.issuer.trim();

      if (!issuer) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issuer is required",
          },
          {
            status: 400,
          }
        );
      }

      if (
        issuer.length >
        200
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issuer cannot exceed 200 characters",
          },
          {
            status: 400,
          }
        );
      }

      existing.issuer =
        issuer;
    }

    /*
     * --------------------------------------------------------
     * ISSUER NAME
     * --------------------------------------------------------
     */

    if (
      body.issuerName !==
      undefined
    ) {
      if (
        typeof body.issuerName !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issuer name must be a string",
          },
          {
            status: 400,
          }
        );
      }

      const issuerName =
        body.issuerName.trim();

      if (
        issuerName.length >
        200
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issuer name cannot exceed 200 characters",
          },
          {
            status: 400,
          }
        );
      }

      existing.issuerName =
        issuerName;
    }

    /*
     * --------------------------------------------------------
     * ISSUER LOGO
     * --------------------------------------------------------
     */

    if (
      body.issuerLogo !==
      undefined
    ) {
      if (
        typeof body.issuerLogo !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issuer logo must be a string",
          },
          {
            status: 400,
          }
        );
      }

      if (
        body.issuerLogo.length >
        1000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Issuer logo URL is too long",
          },
          {
            status: 400,
          }
        );
      }

      existing.issuerLogo =
        body.issuerLogo.trim();
    }

    /*
     * --------------------------------------------------------
     * TEMPLATE
     * --------------------------------------------------------
     */

    if (
      body.template !==
      undefined
    ) {
      if (
        typeof body.template !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Template must be a string",
          },
          {
            status: 400,
          }
        );
      }

      existing.template =
        body.template.trim() ||
        "classic";
    }

    /*
     * --------------------------------------------------------
     * COURSE
     * --------------------------------------------------------
     */

    if (
      body.course !==
      undefined
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          String(
            body.course
          )
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

      existing.course =
        new mongoose.Types.ObjectId(
          String(
            body.course
          )
        );
    }

    /*
     * --------------------------------------------------------
     * VALIDITY
     * --------------------------------------------------------
     */

    if (
      body.validity !==
      undefined
    ) {
      const validity =
        String(
          body.validity
        ).toUpperCase();

      if (
        validity !==
          "PERMANENT" &&
        validity !==
          "LIMITED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Validity must be PERMANENT or LIMITED",
          },
          {
            status: 400,
          }
        );
      }

      existing.validity =
        validity as any;
    }

    /*
     * --------------------------------------------------------
     * VALIDITY DAYS
     * --------------------------------------------------------
     */

    if (
      body.validityDays !==
      undefined
    ) {
      if (
        body.validityDays ===
          null ||
        body.validityDays ===
          ""
      ) {
        existing.validityDays =
          undefined;
      } else {
        const validityDays =
          Number(
            body.validityDays
          );

        if (
          !Number.isFinite(
            validityDays
          ) ||
          validityDays < 1
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Validity days must be a positive number",
            },
            {
              status: 400,
            }
          );
        }

        existing.validityDays =
          validityDays;
      }
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
      const status =
        String(
          body.status
        ).toUpperCase();

      if (
        status !==
          "ACTIVE" &&
        status !==
          "INACTIVE"
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

      existing.status =
        status as any;

      /*
       * Keep isActive synchronized.
       */

      existing.isActive =
        status ===
        "ACTIVE";
    }

    /*
     * --------------------------------------------------------
     * IS ACTIVE
     * --------------------------------------------------------
     */

    if (
      body.isActive !==
      undefined
    ) {
      if (
        typeof body.isActive !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "isActive must be a boolean",
          },
          {
            status: 400,
          }
        );
      }

      existing.isActive =
        body.isActive;

      /*
       * Keep status synchronized.
       */

      existing.status =
        body.isActive
          ? "ACTIVE"
          : "INACTIVE";
    }

    /*
     * --------------------------------------------------------
     * REQUIREMENTS
     * --------------------------------------------------------
     */

    if (
      body.requirements !==
      undefined
    ) {
      const requirements =
        body.requirements;

      if (
        !requirements ||
        typeof requirements !==
          "object" ||
        Array.isArray(
          requirements
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Requirements must be an object",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Completion percentage
       */

      if (
        requirements.completionPercentage !==
          undefined &&
        requirements.completionPercentage !==
          null &&
        requirements.completionPercentage !==
          ""
      ) {
        const value =
          Number(
            requirements.completionPercentage
          );

        if (
          !Number.isFinite(
            value
          ) ||
          value < 0 ||
          value > 100
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Completion percentage must be between 0 and 100",
            },
            {
              status: 400,
            }
          );
        }

        requirements.completionPercentage =
          value;
      }

      /*
       * Minimum score
       */

      if (
        requirements.minimumScore !==
          undefined &&
        requirements.minimumScore !==
          null &&
        requirements.minimumScore !==
          ""
      ) {
        const value =
          Number(
            requirements.minimumScore
          );

        if (
          !Number.isFinite(
            value
          ) ||
          value < 0 ||
          value > 100
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Minimum score must be between 0 and 100",
            },
            {
              status: 400,
            }
          );
        }

        requirements.minimumScore =
          value;
      }

      /*
       * Final assessment
       */

      if (
        requirements.requireFinalAssessment !==
        undefined
      ) {
        if (
          typeof requirements.requireFinalAssessment !==
          "boolean"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "requireFinalAssessment must be a boolean",
            },
            {
              status: 400,
            }
          );
        }
      }

      existing.requirements =
        requirements;
    }

    /*
     * --------------------------------------------------------
     * VALIDITY CONSISTENCY
     * --------------------------------------------------------
     */

    const finalValidity =
      String(
        (existing as any)
          .validity ||
          "PERMANENT"
      ).toUpperCase();

    const finalValidityDays =
      Number(
        (existing as any)
          .validityDays ||
          0
      );

    if (
      finalValidity ===
        "LIMITED" &&
      finalValidityDays < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Validity days are required when validity is LIMITED",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * PERMANENT certificates do not retain
     * validity days.
     */

    if (
      finalValidity ===
      "PERMANENT"
    ) {
      existing.validityDays =
        undefined;
    }

    /*
     * --------------------------------------------------------
     * SAVE
     * --------------------------------------------------------
     */

    await existing.save();

    /*
     * --------------------------------------------------------
     * FETCH UPDATED DOCUMENT
     * --------------------------------------------------------
     */

    const updated =
      await Certificate.findById(
        id
      )
        .populate({
          path: "course",
          select:
            "_id title slug thumbnail description",
        })
        .lean();

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        "Certificate updated successfully",

      certificate:
        updated
          ? {
              ...updated,

              _id:
                String(
                  updated._id
                ),

              course:
                (updated as any)
                  .course
                  ? {
                      ...(
                        updated as any
                      ).course,

                      _id:
                        String(
                          (
                            updated as any
                          ).course
                            ._id
                        ),
                    }
                  : null,
            }
          : null,
    });
  } catch (error: any) {
    /*
     * --------------------------------------------------------
     * DUPLICATE KEY
     * --------------------------------------------------------
     */

    if (
      error?.code ===
      11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A certificate with the same unique value already exists",
        },
        {
          status: 409,
        }
      );
    }

    console.error(
      "[ADMIN CERTIFICATE PATCH] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update certificate",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ============================================================
 * DELETE
 * ============================================================
 *
 * Delete certificate definition.
 *
 * We deliberately prevent deletion once certificates have
 * been issued against the definition.
 *
 * ============================================================
 */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
     * --------------------------------------------------------
     * AUTHORIZATION
     * --------------------------------------------------------
     */

    const auth =
      await authorizeAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    /*
     * --------------------------------------------------------
     * PARAMS
     * --------------------------------------------------------
     */

    const { id } =
      await context.params;

    if (
      !isValidObjectId(id)
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
     * FIND CERTIFICATE
     * --------------------------------------------------------
     */

    const certificate =
      await Certificate.findById(
        id
      );

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
     * CHECK ISSUED CERTIFICATES
     * --------------------------------------------------------
     */

    const issuedCount =
      await UserCertificate.countDocuments(
        {
          certificate:
            id,
        }
      );

    /*
     * --------------------------------------------------------
     * DO NOT DELETE USED DEFINITIONS
     * --------------------------------------------------------
     *
     * Certificates are historical records.
     * Removing their definition could break verification
     * and old certificates.
     *
     * --------------------------------------------------------
     */

    if (
      issuedCount > 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "This certificate cannot be deleted because certificates have already been issued",

          issuedCount,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * --------------------------------------------------------
     * DELETE
     * --------------------------------------------------------
     */

    await Certificate.findByIdAndDelete(
      id
    );

    /*
     * --------------------------------------------------------
     * RESPONSE
     * --------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      message:
        "Certificate deleted successfully",
    });
  } catch (error) {
    console.error(
      "[ADMIN CERTIFICATE DELETE] ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete certificate",
      },
      {
        status: 500,
      }
    );
  }
}