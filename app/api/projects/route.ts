import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import Project from "@/models/Project";

export async function GET() {
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

    await connectDB();

    const projects = await Project.find({
      owner: user.id,
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch projects",
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
          message: "Project name is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.create({
      name: body.name.trim(),
      description: body.description?.trim() || "",
      type: body.type || "WEB",
      status: body.status || "PLANNING",
      technologies: Array.isArray(body.technologies)
        ? body.technologies
        : [],
      repositoryUrl: body.repositoryUrl || "",
      liveUrl: body.liveUrl || "",
      owner: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create project",
      },
      { status: 500 }
    );
  }
}