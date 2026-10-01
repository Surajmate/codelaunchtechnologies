import { NextResponse } from "next/server";

import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";

import SupportTicket from "@/models/SupportTicket";
import SupportMessage from "@/models/SupportMessage";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ======================================================
 * ADMIN SUPPORT MESSAGES API
 * ======================================================
 *
 * GET
 * /api/admin/support/[id]/messages
 *
 * POST
 * /api/admin/support/[id]/messages
 *
 * ======================================================
 */


/*
 * ======================================================
 * GET MESSAGES
 * ======================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN SUPPORT MESSAGES] GET started"
    );

    /*
     * ======================================================
     * ADMIN AUTHENTICATION
     * ======================================================
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ======================================================
     * TICKET ID
     * ======================================================
     */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ticket ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ======================================================
     * VALIDATE OBJECT ID
     * ======================================================
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
            "Invalid ticket ID",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ======================================================
     * DATABASE
     * ======================================================
     */

    await connectDB();

    /*
     * ======================================================
     * VERIFY TICKET
     * ======================================================
 */

    const ticket =
      await SupportTicket.findById(
        id
      )
        .select(
          "_id ticketNumber subject status"
        )
        .lean();

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Support ticket not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ======================================================
     * QUERY PARAMETERS
     * ======================================================
     */

    const { searchParams } =
      new URL(request.url);

    const pageParam =
      Number(
        searchParams.get(
          "page"
        ) || 1
      );

    const limitParam =
      Number(
        searchParams.get(
          "limit"
        ) || 50
      );

    const page =
      Number.isFinite(
        pageParam
      ) &&
      pageParam > 0
        ? Math.floor(
            pageParam
          )
        : 1;

    const limit =
      Number.isFinite(
        limitParam
      ) &&
      limitParam > 0
        ? Math.min(
            Math.floor(
              limitParam
            ),
            100
          )
        : 50;

    /*
     * ======================================================
     * FILTER
     * ======================================================
     */

    const filter = {
      ticket:
        ticket._id,
    };

    /*
     * ======================================================
     * PAGINATION
     * ======================================================
     */

    const skip =
      (page - 1) *
      limit;

    /*
     * ======================================================
     * LOAD MESSAGES
     * ======================================================
     */

    const [
      messages,
      total,
    ] =
      await Promise.all([
        SupportMessage.find(
          filter
        )
          .sort({
            createdAt: 1,
          })
          .skip(skip)
          .limit(limit)
          .populate({
            path: "sender",
            select:
              "_id name email role",
          })
          .lean(),

        SupportMessage.countDocuments(
          filter
        ),
      ]);

    /*
     * ======================================================
     * SANITIZE
     * ======================================================
     */

    const safeMessages =
      messages.map(
        (message: any) => ({
          _id:
            String(
              message._id
            ),

          ticket:
            String(
              message.ticket
            ),

          sender:
            message.sender
              ? {
                  _id:
                    String(
                      message
                        .sender
                        ._id
                    ),

                  name:
                    message
                      .sender
                      .name ||
                    "",

                  email:
                    message
                      .sender
                      .email ||
                    "",

                  role:
                    message
                      .sender
                      .role ||
                    "",
                }
              : null,

          senderType:
            message.senderType,

          message:
            message.message,

          attachments:
            Array.isArray(
              message.attachments
            )
              ? message.attachments.map(
                  (
                    attachment: any
                  ) => ({
                    name:
                      attachment.name,

                    url:
                      attachment.url,

                    type:
                      attachment.type ||
                      "",

                    size:
                      Number(
                        attachment.size ||
                          0
                      ),
                  })
                )
              : [],

          internalNote:
            Boolean(
              message.internalNote
            ),

          readByUser:
            Boolean(
              message.readByUser
            ),

          readByAdmin:
            Boolean(
              message.readByAdmin
            ),

          createdAt:
            message.createdAt,
        })
      );

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json({
      success: true,

      ticket: {
        _id:
          String(
            ticket._id
          ),

        ticketNumber:
          ticket.ticketNumber,

        subject:
          ticket.subject,

        status:
          ticket.status,
      },

      messages:
        safeMessages,

      pagination: {
        page,

        limit,

        total,

        totalPages:
          Math.ceil(
            total / limit
          ),

        hasNextPage:
          page <
          Math.ceil(
            total / limit
          ),

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT MESSAGES] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load support messages",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
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
 * CREATE MESSAGE
 * ======================================================
 *
 * POST
 * /api/admin/support/[id]/messages
 *
 * Request:
 *
 * {
 *   "message": "We have checked the issue.",
 *   "internalNote": false
 * }
 *
 * Internal note:
 *
 * {
 *   "message": "Check API logs before replying.",
 *   "internalNote": true
 * }
 *
 * ======================================================
 */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN SUPPORT MESSAGES] POST started"
    );

    /*
     * ======================================================
     * ADMIN AUTHENTICATION
     * ======================================================
     */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /*
     * ======================================================
     * TICKET ID
     * ======================================================
     */

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ticket ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ======================================================
     * VALIDATE OBJECT ID
     * ======================================================
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
            "Invalid ticket ID",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ======================================================
     * REQUEST BODY
     * ======================================================
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
     * ======================================================
     * MESSAGE VALIDATION
     * ======================================================
     */

    const message =
      typeof body.message ===
      "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Message is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      message.length >
      10000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Message cannot exceed 10000 characters",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ======================================================
     * INTERNAL NOTE
     * ======================================================
     */

    const internalNote =
      body.internalNote ===
      true;

    /*
     * ======================================================
     * DATABASE
     * ======================================================
     */

    await connectDB();

    /*
     * ======================================================
     * LOAD TICKET
     * ======================================================
     */

    const ticket =
      await SupportTicket.findById(
        id
      );

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Support ticket not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ======================================================
     * CLOSED TICKET PROTECTION
     * ======================================================
     *
     * We don't allow normal replies to a closed ticket.
     *
     * Internal notes are still allowed.
     *
     * ======================================================
     */

    if (
      ticket.status ===
        "CLOSED" &&
      !internalNote
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Closed tickets cannot receive customer replies",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ======================================================
     * ADMIN USER
     * ======================================================
     *
     * requireAdmin() normally exposes the authenticated
     * user. We support common property names here.
     *
     * ======================================================
     */

    const adminUserId =
      (auth as any).user?._id ||
      (auth as any).user?.id ||
      (auth as any).userId;

    if (!adminUserId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to determine authenticated admin",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        String(
          adminUserId
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid authenticated admin ID",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ======================================================
     * ATTACHMENTS
     * ======================================================
     *
     * At this stage we accept attachment metadata only.
     *
     * Actual upload/storage can be added later.
     *
     * ======================================================
     */

    let attachments:
      Array<{
        name: string;
        url: string;
        type: string;
        size: number;
      }> = [];

    if (
      Array.isArray(
        body.attachments
      )
    ) {
      attachments =
        body.attachments
          .slice(0, 10)
          .map(
            (
              attachment: any
            ) => ({
              name:
                typeof attachment.name ===
                "string"
                  ? attachment.name
                      .trim()
                      .slice(
                        0,
                        255
                      )
                  : "",

              url:
                typeof attachment.url ===
                "string"
                  ? attachment.url.trim()
                  : "",

              type:
                typeof attachment.type ===
                "string"
                  ? attachment.type
                      .trim()
                      .slice(
                        0,
                        100
                      )
                  : "",

              size:
                Number(
                  attachment.size ||
                    0
                ),
            })
          )
          .filter(
            (
              attachment
            ) =>
              attachment.name &&
              attachment.url
          );
    }

    /*
     * ======================================================
     * CREATE MESSAGE
     * ======================================================
     */

    const newMessage =
      await SupportMessage.create({
        ticket:
          ticket._id,

        sender:
          new mongoose.Types.ObjectId(
            String(
              adminUserId
            )
          ),

        senderType:
          internalNote
            ? "ADMIN"
            : "ADMIN",

        message,

        attachments,

        internalNote,

        readByUser:
          internalNote
            ? true
            : false,

        readByAdmin:
          true,

        createdAt:
          new Date(),
      });

    /*
     * ======================================================
     * UPDATE TICKET
     * ======================================================
     *
     * Internal notes don't change customer-facing
     * conversation status.
     *
     * Normal admin replies:
     *
     * OPEN -> IN_PROGRESS
     * WAITING_FOR_USER -> IN_PROGRESS
     *
     * ======================================================
     */

    if (!internalNote) {
      ticket.lastRepliedBy =
        new mongoose.Types.ObjectId(
          String(
            adminUserId
          )
        );

      ticket.lastRepliedAt =
        new Date();

      if (
        ticket.status ===
          "OPEN" ||
        ticket.status ===
          "WAITING_FOR_USER"
      ) {
        ticket.status =
          "IN_PROGRESS";
      }

      ticket.updatedAt =
        new Date();

      await ticket.save();
    } else {
      ticket.updatedAt =
        new Date();

      await ticket.save();
    }

    /*
     * ======================================================
     * POPULATE SENDER
     * ======================================================
     */

    const populatedMessage =
      await SupportMessage.findById(
        newMessage._id
      )
        .populate({
          path: "sender",
          select:
            "_id name email role",
        })
        .lean();

    /*
     * ======================================================
     * SAFE RESPONSE
     * ======================================================
 */

    const safeMessage: any =
      populatedMessage;

    return NextResponse.json(
      {
        success: true,

        message:
          internalNote
            ? "Internal note added successfully"
            : "Reply sent successfully",

        data: {
          _id:
            String(
              safeMessage?._id
            ),

          ticket:
            String(
              ticket._id
            ),

          sender:
            safeMessage?.sender
              ? {
                  _id:
                    String(
                      safeMessage
                        .sender
                        ._id
                    ),

                  name:
                    safeMessage
                      .sender
                      .name ||
                    "",

                  email:
                    safeMessage
                      .sender
                      .email ||
                    "",

                  role:
                    safeMessage
                      .sender
                      .role ||
                    "",
                }
              : null,

          senderType:
            safeMessage?.senderType,

          message:
            safeMessage?.message,

          attachments:
            safeMessage?.attachments ||
            [],

          internalNote:
            Boolean(
              safeMessage?.internalNote
            ),

          readByUser:
            Boolean(
              safeMessage?.readByUser
            ),

          readByAdmin:
            Boolean(
              safeMessage?.readByAdmin
            ),

          createdAt:
            safeMessage?.createdAt,
        },

        ticket: {
          _id:
            String(
              ticket._id
            ),

          status:
            ticket.status,

          lastRepliedAt:
            ticket.lastRepliedAt ||
            null,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT MESSAGES] POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to send support message",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}