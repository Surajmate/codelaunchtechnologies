import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import API from "@/models/API";
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

    const apis = await API.find({
      owner: user.id,
    })
      .populate("project", "name")
      .sort({
        createdAt: -1,
      });

    return NextResponse.json({
      success: true,
      apis,
    });
  } catch (error) {
    console.error("Get APIs error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch APIs",
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
          message: "API name is required",
        },
        { status: 400 }
      );
    }

    if (!body.endpoint?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "API endpoint is required",
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

    const api = await API.create({
      name: body.name.trim(),

      description:
        body.description?.trim() || "",

      project: body.project,

      owner: user.id,

      method: body.method || "GET",

      endpoint: body.endpoint.trim(),

      baseUrl:
        body.baseUrl?.trim() || "",

      version:
        body.version?.trim() || "v1",

      status:
        body.status || "DRAFT",

      parameters:
        Array.isArray(body.parameters)
          ? body.parameters
          : [],

      headers:
        Array.isArray(body.headers)
          ? body.headers
          : [],

      auth: body.auth || {
        type: "NONE",
      },

      requestBody:
        body.requestBody || "",

      responseExample:
        body.responseExample || "",

      tags:
        Array.isArray(body.tags)
          ? body.tags
          : [],

      documentation:
        body.documentation || "",
    });

    const populatedAPI = await API.findById(
      api._id
    ).populate("project", "name");

    return NextResponse.json(
      {
        success: true,
        api: populatedAPI,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create API",
      },
      { status: 500 }
    );
  }
}