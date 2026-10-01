import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
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

    const project = await Project.findOne({
      _id: id,
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

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch project",
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

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Project name is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOneAndUpdate(
      {
        _id: id,
        owner: user.id,
      },
      {
        name: body.name.trim(),
        description: body.description?.trim() || "",
        type: body.type || "WEB",
        status: body.status || "PLANNING",
        technologies: Array.isArray(body.technologies)
          ? body.technologies
          : [],
        repositoryUrl: body.repositoryUrl || "",
        liveUrl: body.liveUrl || "",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update project",
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

    const project = await Project.findOneAndDelete({
      _id: id,
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

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete project",
      },
      { status: 500 }
    );
  }
}