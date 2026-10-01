import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import SupportTicket from "@/models/SupportTicket";
import SupportMessage from "@/models/SupportMessage";

// IMPORTANT:
// Registers the User mongoose model before populate() is executed.
import "@/models/User";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/*
 * ======================================================
 * GET SUPPORT TICKET
 * ======================================================
 *
 * GET
 * /api/support/[id]
 *
 * Returns:
 *
 * - ticket information
 * - user
 * - assigned admin
 * - messages
 *
 * ======================================================
 */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    console.log(
      "[SUPPORT DETAIL] GET started"
    );

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
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
     * PARAMETER
     * --------------------------------------------------
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
     * --------------------------------------------------
     * DATABASE
     * --------------------------------------------------
     */

    await connectDB();

    /*
     * --------------------------------------------------
     * LOAD TICKET
     * --------------------------------------------------
     *
     * Users can only access their own tickets.
     *
     * --------------------------------------------------
     */

    const ticket =
      await SupportTicket.findOne({
        _id: id,
        user: currentUser.id,
      })
        .populate({
          path: "user",
          select:
            "_id name email avatar role",
        })
        .populate({
          path: "assignedTo",
          select:
            "_id name email avatar role",
        })
        .populate({
          path: "lastRepliedBy",
          select:
            "_id name email avatar role",
        })
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
     * --------------------------------------------------
     * LOAD MESSAGES
     * --------------------------------------------------
     */

    const messages =
      await SupportMessage.find({
        ticket: ticket._id,
        internalNote: false,
      })
        .sort({
          createdAt: 1,
        })
        .populate({
          path: "sender",
          select:
            "_id name email avatar role",
        })
        .lean();

    /*
     * --------------------------------------------------
     * SANITIZE TICKET
     * --------------------------------------------------
     */

    const safeTicket = {
      ...ticket,

      _id: String(
        ticket._id
      ),

      user: ticket.user
        ? {
            _id: String(
              (ticket.user as any)._id
            ),

            name:
              (ticket.user as any).name ||
              "",

            email:
              (ticket.user as any).email ||
              "",

            avatar:
              (ticket.user as any).avatar ||
              "",

            role:
              (ticket.user as any).role ||
              "",
          }
        : null,

      assignedTo:
        ticket.assignedTo
          ? {
              _id: String(
                (ticket.assignedTo as any)
                  ._id
              ),

              name:
                (ticket.assignedTo as any)
                  .name || "",

              email:
                (ticket.assignedTo as any)
                  .email || "",

              avatar:
                (ticket.assignedTo as any)
                  .avatar || "",

              role:
                (ticket.assignedTo as any)
                  .role || "",
            }
          : null,

      lastRepliedBy:
        ticket.lastRepliedBy
          ? {
              _id: String(
                (ticket.lastRepliedBy as any)
                  ._id
              ),

              name:
                (ticket.lastRepliedBy as any)
                  .name || "",

              email:
                (ticket.lastRepliedBy as any)
                  .email || "",

              avatar:
                (ticket.lastRepliedBy as any)
                  .avatar || "",

              role:
                (ticket.lastRepliedBy as any)
                  .role || "",
            }
          : null,
    };

    /*
     * --------------------------------------------------
     * SANITIZE MESSAGES
     * --------------------------------------------------
     */

    const safeMessages =
      messages.map(
        (message: any) => ({
          ...message,

          _id: String(
            message._id
          ),

          ticket: String(
            message.ticket
          ),

          sender:
            message.sender
              ? {
                  _id: String(
                    message.sender._id
                  ),

                  name:
                    message.sender
                      .name || "",

                  email:
                    message.sender
                      .email || "",

                  avatar:
                    message.sender
                      .avatar || "",

                  role:
                    message.sender
                      .role || "",
                }
              : null,

          attachments:
            Array.isArray(
              message.attachments
            )
              ? message.attachments
              : [],
        })
      );

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      ticket: safeTicket,

      messages:
        safeMessages,
    });
  } catch (error) {
    console.error(
      "[SUPPORT DETAIL] ERROR:",
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