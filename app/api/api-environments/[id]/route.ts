import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import APIEnvironment from "@/models/APIEnvironment";
import Project from "@/models/Project";

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

    await connectDB();

    const environment =
      await APIEnvironment.findOne({
        _id: id,
        owner: user.id,
      }).populate("project", "name");

    if (!environment) {
      return NextResponse.json(
        {
          success: false,
          message: "Environment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      environment,
    });
  } catch (error) {
    console.error(
      "Get environment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch environment",
      },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();

    await connectDB();

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
            message: "Project not found",
          },
          { status: 404 }
        );
      }
    }

    const update: Record<
      string,
      unknown
    > = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Environment name is required",
          },
          { status: 400 }
        );
      }

      update.name = body.name.trim();
    }

    if (body.project !== undefined) {
      update.project = body.project;
    }

    if (body.variables !== undefined) {
      if (!Array.isArray(body.variables)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Variables must be an array",
          },
          { status: 400 }
        );
      }

      update.variables = body.variables;
    }

    const environment =
      await APIEnvironment.findOneAndUpdate(
        {
          _id: id,
          owner: user.id,
        },
        update,
        {
          new: true,
          runValidators: true,
        }
      ).populate("project", "name");

    if (!environment) {
      return NextResponse.json(
        {
          success: false,
          message: "Environment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      environment,
    });
  } catch (error) {
    console.error(
      "Update environment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update environment",
      },
      { status: 500 }
    );
  }
}

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

    await connectDB();

    const deleted =
      await APIEnvironment.findOneAndDelete({
        _id: id,
        owner: user.id,
      });

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Environment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Environment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete environment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete environment",
      },
      { status: 500 }
    );
  }
}