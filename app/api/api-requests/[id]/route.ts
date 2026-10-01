import { NextResponse } from "next/server";
import mongoose from "mongoose";

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
 * Fetch one saved API request owned by
 * the currently logged-in user.
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API request ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const apiRequest =
      await APIRequest.findOne({
        _id: id,
        owner: user.id,
      })
        .populate(
          "collection",
          "name description project"
        )
        .populate(
          "project",
          "name"
        );

    if (!apiRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "API request not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      request: apiRequest,
    });
  } catch (error) {
    console.error(
      "Get API request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch API request",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/api-requests/:id
 *
 * Update an existing saved API request.
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
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API request ID",
        },
        { status: 400 }
      );
    }

    const data =
      await request.json();

    await connectDB();

    /*
     * Make sure the existing request
     * belongs to the logged-in user.
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
          message: "API request not found",
        },
        { status: 404 }
      );
    }

    /*
     * Validate collection if supplied.
     */
    let collection:
      | any
      | null = null;

    if (
      data.collection !== undefined
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          data.collection
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid collection ID",
          },
          { status: 400 }
        );
      }

      collection =
        await APICollection.findOne({
          _id: data.collection,
          owner: user.id,
        });

      if (!collection) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Collection not found",
          },
          { status: 404 }
        );
      }
    }

    /*
     * Validate project if supplied.
     */
    if (
      data.project !== undefined
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          data.project
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid project ID",
          },
          { status: 400 }
        );
      }

      const project =
        await Project.findOne({
          _id: data.project,
          owner: user.id,
        });

      if (!project) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Project not found",
          },
          { status: 404 }
        );
      }
    }

    /*
     * If both collection and project are
     * supplied, make sure they belong together.
     */
    if (
      collection &&
      data.project !== undefined &&
      collection.project?.toString() !==
        data.project.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collection does not belong to the selected project",
        },
        { status: 400 }
      );
    }

    /*
     * Build update object.
     */
    const update: Record<
      string,
      unknown
    > = {};

    if (data.name !== undefined) {
      if (
        typeof data.name !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Request name must be a string",
          },
          { status: 400 }
        );
      }

      const trimmedName =
        data.name.trim();

      if (!trimmedName) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Request name is required",
          },
          { status: 400 }
        );
      }

      update.name =
        trimmedName;
    }

    if (data.method !== undefined) {
      update.method =
        String(
          data.method
        ).toUpperCase();
    }

    if (data.url !== undefined) {
      if (
        typeof data.url !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "URL must be a string",
          },
          { status: 400 }
        );
      }

      const url =
        data.url.trim();

      if (!url) {
        return NextResponse.json(
          {
            success: false,
            message:
              "URL is required",
          },
          { status: 400 }
        );
      }

      update.url = url;
    }

    if (
      data.description !==
      undefined
    ) {
      update.description =
        typeof data.description ===
        "string"
          ? data.description.trim()
          : "";
    }

    if (
      data.collection !==
      undefined
    ) {
      update.collection =
        data.collection;
    }

    if (
      data.project !==
      undefined
    ) {
      update.project =
        data.project;
    }

    if (
      data.queryParams !==
      undefined
    ) {
      update.queryParams =
        Array.isArray(
          data.queryParams
        )
          ? data.queryParams
          : [];
    }

    if (
      data.headers !==
      undefined
    ) {
      update.headers =
        Array.isArray(
          data.headers
        )
          ? data.headers
          : [];
    }

    if (
      data.authorization !==
      undefined
    ) {
      update.authorization =
        data.authorization;
    }

    if (
      data.bodyType !==
      undefined
    ) {
      update.bodyType =
        data.bodyType;
    }

    if (
      data.body !==
      undefined
    ) {
      update.body =
        data.body;
    }

    if (
      data.preRequestScript !==
      undefined
    ) {
      update.preRequestScript =
        data.preRequestScript;
    }

    if (
      data.testScript !==
      undefined
    ) {
      update.testScript =
        data.testScript;
    }

    /*
     * Update request.
     */
    const apiRequest =
      await APIRequest.findOneAndUpdate(
        {
          _id: id,
          owner: user.id,
        },
        {
          $set: update,
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "collection",
          "name description project"
        )
        .populate(
          "project",
          "name"
        );

    if (!apiRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "API request not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "API request updated successfully",
      request: apiRequest,
    });
  } catch (error) {
    console.error(
      "Update API request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update API request",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-requests/:id
 *
 * Delete an existing saved API request.
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
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid API request ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted =
      await APIRequest.findOneAndDelete({
        _id: id,
        owner: user.id,
      });

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "API request not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "API request deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete API request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete API request",
      },
      { status: 500 }
    );
  }
}