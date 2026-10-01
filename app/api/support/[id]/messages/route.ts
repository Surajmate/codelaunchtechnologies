import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import SupportTicket from "@/models/SupportTicket";
import SupportMessage from "@/models/SupportMessage";

// IMPORTANT:
// Register User model before populate/create operations involving User.
// Change this import path if your User model is located elsewhere.
import "@/models/User";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const ticket = await SupportTicket.findOne({
      _id: id,
      user: user.id,
    })
      .select("_id")
      .lean();

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Support ticket not found",
        },
        { status: 404 }
      );
    }

    const messages = await SupportMessage.find({
      ticket: ticket._id,
      internalNote: false,
    })
      .sort({
        createdAt: 1,
      })
      .populate({
        path: "sender",
        select: "_id name email role",
      })
      .lean();

    /*
     * Mark admin messages as read.
     */

    await SupportMessage.updateMany(
      {
        ticket: ticket._id,
        senderType: "ADMIN",
        internalNote: false,
        readByUser: false,
      },
      {
        $set: {
          readByUser: true,
        },
      }
    );

    return NextResponse.json({
      success: true,

      messages: messages.map((message: any) => ({
        _id: String(message._id),

        ticket: String(message.ticket),

        sender: message.sender
          ? {
              _id: String(message.sender._id),
              name: message.sender.name || "",
              email: message.sender.email || "",
              role: message.sender.role || "",
            }
          : null,

        senderType: message.senderType,

        message: message.message,

        attachments: message.attachments || [],

        internalNote: false,

        readByUser: message.readByUser,

        readByAdmin: message.readByAdmin,

        createdAt: message.createdAt,
      })),
    });
  } catch (error: any) {
    console.error(
      "[USER SUPPORT] GET MESSAGES ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load messages",
        error:
          process.env.NODE_ENV === "development"
            ? error?.message || String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

/*
 * ======================================================
 * SEND MESSAGE
 * ======================================================
 *
 * POST
 * /api/support/[id]/messages
 *
 * Body:
 *
 * {
 *   "message": "I still need help"
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
      "[USER SUPPORT] POST MESSAGE START"
    );

    const user = await getCurrentUser();

    console.log(
      "[USER SUPPORT] CURRENT USER:",
      user
        ? {
            id: user.id,
            email: user.email,
            role: user.role,
          }
        : null
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    console.log(
      "[USER SUPPORT] TICKET ID:",
      id
    );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid ticket ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    console.log(
      "[USER SUPPORT] DATABASE CONNECTED"
    );

    /*
     * --------------------------------------------------
     * FIND TICKET
     * --------------------------------------------------
     */

    const ticket = await SupportTicket.findOne({
      _id: id,
      user: user.id,
    });

    console.log(
      "[USER SUPPORT] TICKET FOUND:",
      ticket
        ? {
            id: String(ticket._id),
            status: ticket.status,
            user: String(ticket.user),
          }
        : null
    );

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Support ticket not found",
        },
        { status: 404 }
      );
    }

    /*
     * --------------------------------------------------
     * CLOSED TICKET
     * --------------------------------------------------
     */

    if (ticket.status === "CLOSED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot reply to a closed ticket",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * READ REQUEST BODY
     * --------------------------------------------------
     */

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    console.log(
      "[USER SUPPORT] REQUEST BODY:",
      {
        hasMessage:
          typeof body?.message === "string",
        messageLength:
          typeof body?.message === "string"
            ? body.message.length
            : 0,
      }
    );

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message: "Message is required",
        },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Message cannot exceed 10000 characters",
        },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------
     * CREATE SUPPORT MESSAGE
     * --------------------------------------------------
     */

    console.log(
      "[USER SUPPORT] CREATING MESSAGE"
    );

    const supportMessage =
      new SupportMessage({
        ticket: ticket._id,

        sender: new mongoose.Types.ObjectId(
          user.id
        ),

        senderType: "USER",

        message,

        attachments: [],

        internalNote: false,

        readByUser: true,

        readByAdmin: false,
      });

    await supportMessage.save();

    console.log(
      "[USER SUPPORT] MESSAGE CREATED:",
      String(supportMessage._id)
    );

    /*
     * --------------------------------------------------
     * UPDATE TICKET
     * --------------------------------------------------
     */

    ticket.lastRepliedBy =
      new mongoose.Types.ObjectId(user.id);

    ticket.lastRepliedAt = new Date();

    /*
     * If support was waiting for user,
     * move it back to IN_PROGRESS.
     */

    if (
      ticket.status ===
      "WAITING_FOR_USER"
    ) {
      ticket.status = "IN_PROGRESS";
    }

    await ticket.save();

    console.log(
      "[USER SUPPORT] TICKET UPDATED"
    );

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        message:
          "Reply sent successfully",

        data: {
          _id: String(
            supportMessage._id
          ),

          ticket: String(
            supportMessage.ticket
          ),

          sender: {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },

          senderType:
            supportMessage.senderType,

          message:
            supportMessage.message,

          attachments:
            supportMessage.attachments || [],

          internalNote: false,

          readByUser:
            supportMessage.readByUser,

          readByAdmin:
            supportMessage.readByAdmin,

          createdAt:
            supportMessage.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "=================================================="
    );

    console.error(
      "[USER SUPPORT] SEND MESSAGE ERROR"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Stack:",
      error?.stack
    );

    console.error(
      "=================================================="
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to send message",

        error:
          process.env.NODE_ENV === "development"
            ? error?.message ||
              String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}