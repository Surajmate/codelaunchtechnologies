import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import API from "@/models/API";

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

    const api = await API.findOne({
      _id: id,
      owner: user.id,
    }).populate("project", "name");

    if (!api) {
      return NextResponse.json(
        {
          success: false,
          message: "API not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      api,
    });
  } catch (error) {
    console.error("Get API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch API",
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

    await connectDB();

    const api = await API.findOneAndUpdate(
      {
        _id: id,
        owner: user.id,
      },
      {
        name: body.name.trim(),

        description:
          body.description?.trim() || "",

        project: body.project,

        method:
          body.method || "GET",

        endpoint:
          body.endpoint.trim(),

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

        auth:
          body.auth || {
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
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("project", "name");

    if (!api) {
      return NextResponse.json(
        {
          success: false,
          message: "API not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      api,
    });
  } catch (error) {
    console.error("Update API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update API",
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

    const api = await API.findOneAndDelete({
      _id: id,
      owner: user.id,
    });

    if (!api) {
      return NextResponse.json(
        {
          success: false,
          message: "API not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API deleted successfully",
    });
  } catch (error) {
    console.error("Delete API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete API",
      },
      { status: 500 }
    );
  }
}