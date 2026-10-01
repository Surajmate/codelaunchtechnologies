import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import APIRequest from "@/models/APIRequest";
import APICollection from "@/models/APICollection";
import Project from "@/models/Project";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/api-requests/:id
 *
 * Get a single saved API request.
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
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    await connectDB();

    const apiRequest =
      await APIRequest.findOne({
        _id: id,
        owner: user.id,
      })
        .populate(
          "collection",
          "name"
        )
        .populate(
          "project",
          "name"
        )
        .lean();

    if (!apiRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "API request not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      request: apiRequest,
    });
  } catch (error) {
    console.error(
      "GET /api/api-requests/:id error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch API request",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * PUT /api/api-requests/:id
 *
 * Update a saved API request.
 */
export async function PUT(
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
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const body = await request.json();

    await connectDB();

    /*
     * Make sure request exists
     * and belongs to the logged-in user.
     */
    const existingRequest =
      await APIRequest.findOne({
        _id: id,
        owner: user.id,
      });

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "API request not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Validate name if supplied.
     */
    if (
      body.name !== undefined &&
      (!body.name ||
        typeof body.name !==
          "string" ||
        !body.name.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request name is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate URL if supplied.
     */
    if (
      body.url !== undefined &&
      (!body.url ||
        typeof body.url !==
          "string" ||
        !body.url.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request URL is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate destination project.
     */
    if (body.project) {
      const project =
        await Project.findOne({
          _id: body.project,
          owner: user.id,
        });

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project not found",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * Validate destination collection.
     */
    if (body.collection) {
      const collection =
        await APICollection.findOne({
          _id: body.collection,
          owner: user.id,
        });

      if (!collection) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Collection not found",
          },
          {
            status: 404,
          }
        );
      }

      /*
       * If project is also supplied,
       * make sure collection belongs
       * to that project.
       */
      if (
        body.project &&
        collection.project.toString() !==
          body.project.toString()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Collection does not belong to the selected project",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Build update object.
     */
    const update: Record<
      string,
      unknown
    > = {};

    if (body.name !== undefined) {
      update.name =
        body.name.trim();
    }

    if (body.method !== undefined) {
      update.method =
        body.method;
    }

    if (body.url !== undefined) {
      update.url =
        body.url.trim();
    }

    if (
      body.description !==
      undefined
    ) {
      update.description =
        body.description;
    }

    if (body.project !== undefined) {
      update.project =
        body.project;
    }

    if (
      body.collection !==
      undefined
    ) {
      update.collection =
        body.collection;
    }

    if (
      body.queryParams !==
      undefined
    ) {
      update.queryParams =
        Array.isArray(
          body.queryParams
        )
          ? body.queryParams
          : [];
    }

    if (body.headers !== undefined) {
      update.headers =
        Array.isArray(
          body.headers
        )
          ? body.headers
          : [];
    }

    if (
      body.authorization !==
      undefined
    ) {
      update.authorization =
        body.authorization;
    }

    if (
      body.bodyType !==
      undefined
    ) {
      update.bodyType =
        body.bodyType;
    }

    if (body.body !== undefined) {
      update.body =
        body.body;
    }

    if (
      body.preRequestScript !==
      undefined
    ) {
      update.preRequestScript =
        body.preRequestScript;
    }

    if (
      body.testScript !==
      undefined
    ) {
      update.testScript =
        body.testScript;
    }

    const updatedRequest =
      await APIRequest.findOneAndUpdate(
        {
          _id: id,
          owner: user.id,
        },
        update,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "collection",
          "name"
        )
        .populate(
          "project",
          "name"
        )
        .lean();

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error(
      "PUT /api/api-requests/:id error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update API request",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * DELETE /api/api-requests/:id
 *
 * Delete a saved API request.
 */
export async function DELETE(
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
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    await connectDB();

    const deletedRequest =
      await APIRequest.findOneAndDelete({
        _id: id,
        owner: user.id,
      });

    if (!deletedRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "API request not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "API request deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/api-requests/:id error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete API request",
      },
      {
        status: 500,
      }
    );
  }
}