import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import APICollection from "@/models/APICollection";
import Project from "@/models/Project";

/**
 * GET /api/api-collections
 *
 * Returns all collections belonging
 * to the currently logged-in user.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

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

    await connectDB();

    const collections =
      await APICollection.find({
        owner: user.id,
      })
        .populate("project", "name")
        .sort({
          createdAt: -1,
        })
        .lean();

    return NextResponse.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error(
      "GET /api/api-collections error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch collections",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/api-collections
 *
 * Creates a new API collection.
 */
export async function POST(
  request: Request
) {
  try {
    /*
     * Check authentication
     */
    const user = await getCurrentUser();

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
     * Read request body
     */
    const body = await request.json();

    /*
     * Validate collection name
     */
    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collection name is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate project
     */
    if (!body.project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project is required",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    /*
     * Verify that the selected project
     * belongs to the logged-in user.
     */
    const project =
      await Project.findOne({
        _id: body.project,
        owner: user.id,
      });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Create collection
     *
     * Requests are NOT stored here.
     *
     * API requests are stored separately
     * in the APIRequest model and reference
     * this collection.
     */
    const collection =
      await APICollection.create({
        name: body.name.trim(),

        description:
          typeof body.description ===
          "string"
            ? body.description.trim()
            : "",

        project: body.project,

        owner: user.id,
      });

    /*
     * Fetch newly created collection
     * with project information.
     */
    const populated =
      await APICollection.findById(
        collection._id
      )
        .populate("project", "name")
        .lean();

    return NextResponse.json(
      {
        success: true,
        collection: populated,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/api-collections error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create collection",
      },
      {
        status: 500,
      }
    );
  }
}