import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import APIRequest from "@/models/APIRequest";
import APICollection from "@/models/APICollection";
import Project from "@/models/Project";

export async function GET(
  request: Request
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

    const { searchParams } =
      new URL(request.url);

    const collectionId =
      searchParams.get("collection");

    const projectId =
      searchParams.get("project");

    await connectDB();

    const filter: Record<string, unknown> = {
      owner: user.id,
    };

    if (collectionId) {
      filter.collection = collectionId;
    }

    if (projectId) {
      filter.project = projectId;
    }

    const requests =
      await APIRequest.find(filter)
        .populate(
          "collection",
          "name"
        )
        .populate(
          "project",
          "name"
        )
        .sort({
          createdAt: -1,
        });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error(
      "Get API requests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch API requests",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
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

    const data = await request.json();

    if (!data.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request name is required",
        },
        { status: 400 }
      );
    }

    if (!data.url?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Request URL is required",
        },
        { status: 400 }
      );
    }

    if (!data.project) {
      return NextResponse.json(
        {
          success: false,
          message: "Project is required",
        },
        { status: 400 }
      );
    }

    if (!data.collection) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collection is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    /*
     * Make sure the project belongs
     * to the logged-in user.
     */
    const project =
      await Project.findOne({
        _id: data.project,
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

    /*
     * Make sure collection belongs
     * to the logged-in user and project.
     */
    const collection =
      await APICollection.findOne({
        _id: data.collection,
        owner: user.id,
        project: data.project,
      });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          message: "Collection not found",
        },
        { status: 404 }
      );
    }

    const apiRequest =
      await APIRequest.create({
        name: data.name.trim(),

        method:
          data.method || "GET",

        url: data.url.trim(),

        description:
          data.description || "",

        project: data.project,

        collection: data.collection,

        owner: user.id,

        queryParams:
          Array.isArray(
            data.queryParams
          )
            ? data.queryParams
            : [],

        headers:
          Array.isArray(data.headers)
            ? data.headers
            : [],

        authorization:
          data.authorization || {
            type: "NONE",
          },

        bodyType:
          data.bodyType || "none",

        body:
          data.body || "",

        preRequestScript:
          data.preRequestScript || "",

        testScript:
          data.testScript || "",
      });

    const populated =
      await APIRequest.findById(
        apiRequest._id
      )
        .populate(
          "collection",
          "name"
        )
        .populate(
          "project",
          "name"
        );

    return NextResponse.json(
      {
        success: true,
        request: populated,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create API request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create API request",
      },
      { status: 500 }
    );
  }
}