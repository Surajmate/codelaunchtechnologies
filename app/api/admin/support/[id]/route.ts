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
 * ADMIN SUPPORT TICKET DETAIL API
 * ======================================================
 *
 * GET
 * /api/admin/support/[id]
 *
 * POST
 * /api/admin/support/[id]
 *
 * PATCH
 * /api/admin/support/[id]
 *
 * DELETE
 * /api/admin/support/[id]
 *
 * ======================================================
 */


/*
 * ======================================================
 * GET TICKET
 * ======================================================
 *
 * Returns:
 *
 * - Ticket information
 * - Customer information
 * - Assigned admin
 * - Last replied by
 * - Complete conversation
 *
 * ======================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN SUPPORT DETAIL] GET started"
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
     * ID
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
     * LOAD TICKET
     * ======================================================
     */

    const ticket =
      await SupportTicket.findById(
        id
      )
        .populate({
          path: "user",
          select:
            "_id name email role",
        })
        .populate({
          path: "assignedTo",
          select:
            "_id name email role",
        })
        .populate({
          path:
            "lastRepliedBy",
          select:
            "_id name email role",
        })
        .lean();

    /*
     * ======================================================
     * NOT FOUND
     * ======================================================
     */

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
     * LOAD MESSAGES
     * ======================================================
     */

    const messages =
      await SupportMessage.find({
        ticket:
          ticket._id,
      })
        .sort({
          createdAt: 1,
        })
        .populate({
          path: "sender",
          select:
            "_id name email role",
        })
        .lean();

    /*
     * ======================================================
     * SANITIZE MESSAGES
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
                      attachment.size ||
                      0,
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
     * SAFE TICKET
     * ======================================================
     */

    const safeTicket = {
      _id:
        String(
          (ticket as any)._id
        ),

      ticketNumber:
        (ticket as any)
          .ticketNumber,

      subject:
        (ticket as any)
          .subject,

      description:
        (ticket as any)
          .description,

      category:
        (ticket as any)
          .category,

      priority:
        (ticket as any)
          .priority,

      status:
        (ticket as any)
          .status,

      user:
        (ticket as any)
          .user
          ? {
              _id:
                String(
                  (ticket as any)
                    .user._id
                ),

              name:
                (ticket as any)
                  .user.name ||
                "",

              email:
                (ticket as any)
                  .user.email ||
                "",

              role:
                (ticket as any)
                  .user.role ||
                "",
            }
          : null,

      assignedTo:
        (ticket as any)
          .assignedTo
          ? {
              _id:
                String(
                  (ticket as any)
                    .assignedTo._id
                ),

              name:
                (ticket as any)
                  .assignedTo.name ||
                "",

              email:
                (ticket as any)
                  .assignedTo.email ||
                "",

              role:
                (ticket as any)
                  .assignedTo.role ||
                "",
            }
          : null,

      lastRepliedBy:
        (ticket as any)
          .lastRepliedBy
          ? {
              _id:
                String(
                  (ticket as any)
                    .lastRepliedBy
                    ._id
                ),

              name:
                (ticket as any)
                  .lastRepliedBy.name ||
                "",

              email:
                (ticket as any)
                  .lastRepliedBy.email ||
                "",

              role:
                (ticket as any)
                  .lastRepliedBy.role ||
                "",
            }
          : null,

      lastRepliedAt:
        (ticket as any)
          .lastRepliedAt ||
        null,

      resolvedAt:
        (ticket as any)
          .resolvedAt ||
        null,

      closedAt:
        (ticket as any)
          .closedAt ||
        null,

      createdAt:
        (ticket as any)
          .createdAt,

      updatedAt:
        (ticket as any)
          .updatedAt,
    };

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json({
      success: true,

      ticket:
        safeTicket,

      messages:
        safeMessages,

      messageCount:
        safeMessages.length,
    });
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT DETAIL] GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load support ticket",

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
 * ADMIN REPLY / INTERNAL NOTE
 * ======================================================
 *
 * POST
 * /api/admin/support/[id]
 *
 * Normal reply:
 *
 * {
 *   "message": "We have resolved the issue."
 * }
 *
 * Internal note:
 *
 * {
 *   "message": "Customer issue is related to expired token.",
 *   "internalNote": true
 * }
 *
 * Optional attachments:
 *
 * {
 *   "message": "Please see attached file.",
 *   "attachments": [
 *     {
 *       "name": "error.png",
 *       "url": "https://example.com/error.png",
 *       "type": "image/png",
 *       "size": 12345
 *     }
 *   ]
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
      "[ADMIN SUPPORT DETAIL] POST started"
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
     * ID
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
     * PARSE BODY
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
     * MESSAGE
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
      body.internalNote === true;

    /*
     * ======================================================
     * ATTACHMENTS
     * ======================================================
     *
     * We only store attachment metadata.
     *
     * Actual upload/storage should be handled
     * separately.
     *
     * ======================================================
     */

    let attachments: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }> = [];

    if (
      body.attachments !==
      undefined
    ) {
      if (
        !Array.isArray(
          body.attachments
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Attachments must be an array",
          },
          {
            status: 400,
          }
        );
      }

      if (
        body.attachments.length >
        10
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maximum 10 attachments are allowed",
          },
          {
            status: 400,
          }
        );
      }

      for (
        const attachment of
          body.attachments
      ) {
        if (
          !attachment ||
          typeof attachment !==
            "object"
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid attachment",
            },
            {
              status: 400,
            }
          );
        }

        const name =
          typeof attachment.name ===
          "string"
            ? attachment.name.trim()
            : "";

        const url =
          typeof attachment.url ===
          "string"
            ? attachment.url.trim()
            : "";

        const type =
          typeof attachment.type ===
          "string"
            ? attachment.type.trim()
            : "";

        const size =
          Number(
            attachment.size
          ) || 0;

        if (!name) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Attachment name is required",
            },
            {
              status: 400,
            }
          );
        }

        if (!url) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Attachment URL is required",
            },
            {
              status: 400,
            }
          );
        }

        if (
          size < 0
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Attachment size cannot be negative",
            },
            {
              status: 400,
            }
          );
        }

        attachments.push({
          name:
            name.slice(
              0,
              255
            ),

          url,

          type,

          size,
        });
      }
    }

    /*
     * ======================================================
     * DATABASE
     * ======================================================
     */

    await connectDB();

    /*
     * ======================================================
     * FIND TICKET
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
     * CLOSED TICKET
     * ======================================================
     *
     * Do not allow replies to permanently closed tickets.
     *
     * Admin can reopen using PATCH first.
     *
     * ======================================================
     */

    if (
      ticket.status ===
      "CLOSED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot reply to a closed ticket. Reopen the ticket first.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ======================================================
     * CREATE MESSAGE
     * ======================================================
     */

    const supportMessage =
      await SupportMessage.create({
        ticket:
          ticket._id,

        sender:
          auth.user.id,

        senderType:
          "ADMIN",

        message,

        attachments,

        internalNote,

        /*
         * Admin just created the message,
         * therefore it is already read by admin.
         *
         * User has not necessarily read it.
         */

        readByAdmin:
          true,

        readByUser:
          false,

        createdAt:
          new Date(),
      });

    /*
     * ======================================================
     * UPDATE TICKET
     * ======================================================
     *
     * Internal notes should not change the
     * customer-facing reply information.
     *
     * Normal replies:
     *
     * - update lastRepliedBy
     * - update lastRepliedAt
     * - move OPEN / WAITING_FOR_USER
     *   back to IN_PROGRESS
     *
     * ======================================================
     */

    const now =
      new Date();

    if (!internalNote) {
      ticket.lastRepliedBy =
        new mongoose.Types.ObjectId(
          auth.user.id
        );

      ticket.lastRepliedAt =
        now;

      /*
       * A support response means the
       * ticket is actively being handled.
       */

      if (
        ticket.status ===
          "OPEN" ||
        ticket.status ===
          "WAITING_FOR_USER"
      ) {
        ticket.status =
          "IN_PROGRESS";
      }

      /*
       * If the ticket was previously
       * resolved, reopen it.
       */

      if (
        ticket.status ===
        "RESOLVED"
      ) {
        ticket.status =
          "IN_PROGRESS";

        ticket.resolvedAt =
          null;
      }
    }

    ticket.updatedAt =
      now;

    await ticket.save();

    /*
     * ======================================================
     * POPULATE MESSAGE SENDER
     * ======================================================
     */

    const populatedMessage =
      await SupportMessage.findById(
        supportMessage._id
      )
        .populate({
          path: "sender",
          select:
            "_id name email role",
        })
        .lean();

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json(
      {
        success: true,

        message:
          internalNote
            ? "Internal note added successfully"
            : "Reply sent successfully",

        ticket: {
          _id:
            String(
              ticket._id
            ),

          status:
            ticket.status,

          lastRepliedBy:
            ticket.lastRepliedBy
              ? String(
                  ticket.lastRepliedBy
                )
              : null,

          lastRepliedAt:
            ticket.lastRepliedAt ||
            null,

          resolvedAt:
            ticket.resolvedAt ||
            null,

          updatedAt:
            ticket.updatedAt,
        },

        supportMessage:
          populatedMessage
            ? {
                _id:
                  String(
                    populatedMessage._id
                  ),

                ticket:
                  String(
                    populatedMessage.ticket
                  ),

                sender:
                  populatedMessage.sender
                    ? {
                        _id:
                          String(
                            (
                              populatedMessage
                                .sender as any
                            )._id
                          ),

                        name:
                          (
                            populatedMessage
                              .sender as any
                          ).name ||
                          "",

                        email:
                          (
                            populatedMessage
                              .sender as any
                          ).email ||
                          "",

                        role:
                          (
                            populatedMessage
                              .sender as any
                          ).role ||
                          "",
                      }
                    : null,

                senderType:
                  populatedMessage.senderType,

                message:
                  populatedMessage.message,

                attachments:
                  Array.isArray(
                    populatedMessage.attachments
                  )
                    ? populatedMessage.attachments.map(
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
                            attachment.size ||
                            0,
                        })
                      )
                    : [],

                internalNote:
                  Boolean(
                    populatedMessage.internalNote
                  ),

                readByUser:
                  Boolean(
                    populatedMessage.readByUser
                  ),

                readByAdmin:
                  Boolean(
                    populatedMessage.readByAdmin
                  ),

                createdAt:
                  populatedMessage.createdAt,
              }
            : null,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT DETAIL] POST ERROR:",
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


/*
 * ======================================================
 * UPDATE TICKET
 * ======================================================
 *
 * PATCH
 * /api/admin/support/[id]
 *
 * Supported fields:
 *
 * status
 * priority
 * category
 * assignedTo
 *
 * ======================================================
 */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN SUPPORT DETAIL] PATCH started"
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
     * ID
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
     * PARSE BODY
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
     * ALLOWED VALUES
     * ======================================================
     */

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_USER",
      "RESOLVED",
      "CLOSED",
    ];

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    const allowedCategories = [
      "ACCOUNT",
      "TECHNICAL",
      "COURSE",
      "QUIZ",
      "INTEGRATION",
      "PAYMENT",
      "BUG",
      "FEATURE_REQUEST",
      "OTHER",
    ];

    /*
     * ======================================================
     * TRACK CHANGES
     * ======================================================
     */

    const changes: Record<
      string,
      {
        from: unknown;
        to: unknown;
      }
    > = {};

    /*
     * ======================================================
     * STATUS
     * ======================================================
     */

    if (
      body.status !==
      undefined
    ) {
      const status =
        String(
          body.status
        )
          .trim()
          .toUpperCase();

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid status",
          },
          {
            status: 400,
          }
        );
      }

      if (
        ticket.status !==
        status
      ) {
        const previousStatus =
          ticket.status;

        changes.status = {
          from:
            previousStatus,
          to:
            status,
        };

        ticket.status =
          status as any;

        /*
         * --------------------------------------------------
         * RESOLVED
         * --------------------------------------------------
         */

        if (
          status ===
          "RESOLVED"
        ) {
          ticket.resolvedAt =
            new Date();
        } else if (
          previousStatus ===
            "RESOLVED" &&
          status !==
            "RESOLVED"
        ) {
          ticket.resolvedAt =
            null;
        }

        /*
         * --------------------------------------------------
         * CLOSED
         * --------------------------------------------------
         */

        if (
          status ===
          "CLOSED"
        ) {
          ticket.closedAt =
            new Date();
        } else if (
          status !==
          "CLOSED"
        ) {
          ticket.closedAt =
            null;
        }
      }
    }

    /*
     * ======================================================
     * PRIORITY
     * ======================================================
     */

    if (
      body.priority !==
      undefined
    ) {
      const priority =
        String(
          body.priority
        )
          .trim()
          .toUpperCase();

      if (
        !allowedPriorities.includes(
          priority
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid priority",
          },
          {
            status: 400,
          }
        );
      }

      if (
        ticket.priority !==
        priority
      ) {
        changes.priority = {
          from:
            ticket.priority,
          to:
            priority,
        };

        ticket.priority =
          priority as any;
      }
    }

    /*
     * ======================================================
     * CATEGORY
     * ======================================================
     */

    if (
      body.category !==
      undefined
    ) {
      const category =
        String(
          body.category
        )
          .trim()
          .toUpperCase();

      if (
        !allowedCategories.includes(
          category
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid category",
          },
          {
            status: 400,
          }
        );
      }

      if (
        ticket.category !==
        category
      ) {
        changes.category = {
          from:
            ticket.category,
          to:
            category,
        };

        ticket.category =
          category as any;
      }
    }

    /*
     * ======================================================
     * ASSIGN ADMIN
     * ======================================================
     *
     * Send:
     *
     * assignedTo:
     * "USER_OBJECT_ID"
     *
     * To unassign:
     *
     * assignedTo:
     * null
     *
     * ======================================================
     */

    if (
      body.assignedTo !==
      undefined
    ) {
      let newAssignedTo:
        | mongoose.Types.ObjectId
        | null =
        null;

      if (
        body.assignedTo
      ) {
        if (
          !mongoose.Types.ObjectId.isValid(
            body.assignedTo
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid assigned admin ID",
            },
            {
              status: 400,
            }
          );
        }

        newAssignedTo =
          new mongoose.Types.ObjectId(
            body.assignedTo
          );
      }

      const oldAssignedTo =
        ticket.assignedTo
          ? String(
              ticket.assignedTo
            )
          : null;

      const newAssignedId =
        newAssignedTo
          ? String(
              newAssignedTo
            )
          : null;

      if (
        oldAssignedTo !==
        newAssignedId
      ) {
        changes.assignedTo = {
          from:
            oldAssignedTo,
          to:
            newAssignedId,
        };

        ticket.assignedTo =
          newAssignedTo;
      }
    }

    /*
     * ======================================================
     * NO CHANGES
     * ======================================================
     */

    if (
      Object.keys(
        changes
      ).length === 0
    ) {
      return NextResponse.json({
        success: true,

        message:
          "No changes were made",

        ticketId: id,

        changes: {},
      });
    }

    /*
     * ======================================================
     * SAVE
     * ======================================================
     */

    ticket.updatedAt =
      new Date();

    await ticket.save();

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json({
      success: true,

      message:
        "Support ticket updated successfully",

      ticketId: String(
        ticket._id
      ),

      changes,

      status:
        ticket.status,

      priority:
        ticket.priority,

      category:
        ticket.category,

      assignedTo:
        ticket.assignedTo
          ? String(
              ticket.assignedTo
            )
          : null,

      resolvedAt:
        ticket.resolvedAt ||
        null,

      closedAt:
        ticket.closedAt ||
        null,
    });
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT DETAIL] PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to update support ticket",

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
 * DELETE TICKET
 * ======================================================
 *
 * DELETE
 * /api/admin/support/[id]
 *
 * Deletes:
 *
 * 1. Ticket
 * 2. All associated messages
 *
 * ======================================================
 */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[ADMIN SUPPORT DETAIL] DELETE started"
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
     * ID
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
     * FIND TICKET
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
     * DELETE MESSAGES
     * ======================================================
     */

    await SupportMessage.deleteMany({
      ticket:
        ticket._id,
    });

    /*
     * ======================================================
     * DELETE TICKET
     * ======================================================
     */

    await SupportTicket.deleteOne({
      _id:
        ticket._id,
    });

    /*
     * ======================================================
     * RESPONSE
     * ======================================================
     */

    return NextResponse.json({
      success: true,

      message:
        "Support ticket deleted successfully",

      ticketId: id,
    });
  } catch (error) {
    console.error(
      "[ADMIN SUPPORT DETAIL] DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to delete support ticket",

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