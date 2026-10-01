import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import APIEnvironment from "@/models/APIEnvironment";
import Project from "@/models/Project";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project");

    await connectDB();

    const filter: Record<string, unknown> = {
      owner: user.id,
    };

    if (projectId) {
      filter.project = projectId;
    }

    const environments = await APIEnvironment.find(filter)
      .populate("project", "name")
      .sort({
        createdAt: -1,
      });

    return NextResponse.json({
      success: true,
      environments,
    });
  } catch (error) {
    console.error(
      "Get environments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch environments",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Environment name is required",
        },
        { status: 400 }
      );
    }

    if (!body.project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findOne({
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

    const environment =
      await APIEnvironment.create({
        name: body.name.trim(),
        project: body.project,
        owner: user.id,
        variables: Array.isArray(body.variables)
          ? body.variables
          : [],
      });

    const populated =
      await APIEnvironment.findById(
        environment._id
      ).populate("project", "name");

    return NextResponse.json(
      {
        success: true,
        environment: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create environment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create environment",
      },
      { status: 500 }
    );
  }
}