import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";

import Roadmap from "@/models/Roadmap";
import Module from "@/models/Module";
import Lesson from "@/models/Lesson";
import Practice from "@/models/Practice";

const roadmaps = [
  {
    title: "Full Stack Development",
    slug: "full-stack",
    description:
      "A complete journey from web fundamentals to building and deploying production-ready full-stack applications.",
    level: "Beginner → Advanced",
    duration: "6–8 Months",
    technologies: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "Git",
    ],
    icon: "Layers3",
    featured: true,
    published: true,
  },

  {
    title: "Backend Development",
    slug: "backend",
    description:
      "Build scalable backend services, APIs and database-driven applications.",
    level: "Intermediate",
    duration: "4–6 Months",
    technologies: [
      "Node.js",
      "Express",
      "REST API",
      "MongoDB",
      "PostgreSQL",
    ],
    icon: "Server",
    featured: false,
    published: true,
  },

  {
    title: "Frontend Development",
    slug: "frontend",
    description:
      "Master modern frontend development and build responsive, interactive web experiences.",
    level: "Beginner → Intermediate",
    duration: "3–5 Months",
    technologies: [
      "HTML",
      "CSS",
      "JavaScript",
      "React",
      "Next.js",
    ],
    icon: "Globe",
    featured: false,
    published: true,
  },

  {
    title: "Java Backend",
    slug: "java",
    description:
      "Learn enterprise backend development using Java, Spring Boot, REST APIs and databases.",
    level: "Intermediate → Advanced",
    duration: "5–7 Months",
    technologies: [
      "Java",
      "Spring Boot",
      "REST",
      "JPA",
      "MySQL",
    ],
    icon: "Code2",
    featured: false,
    published: true,
  },

  {
    title: "Python Development",
    slug: "python",
    description:
      "Learn Python programming, APIs, automation, backend development and practical applications.",
    level: "Beginner → Advanced",
    duration: "4–6 Months",
    technologies: [
      "Python",
      "FastAPI",
      "Django",
      "PostgreSQL",
      "APIs",
    ],
    icon: "Zap",
    featured: false,
    published: true,
  },

  {
    title: "Data & AI",
    slug: "data-ai",
    description:
      "Build a strong foundation in data analysis, machine learning and modern AI development.",
    level: "Intermediate → Advanced",
    duration: "6–9 Months",
    technologies: [
      "Python",
      "Pandas",
      "Machine Learning",
      "AI",
      "LLMs",
    ],
    icon: "Database",
    featured: false,
    published: true,
  },
];

const fullStackModules = [
  {
    title: "Web Fundamentals",
    slug: "web-fundamentals",
    description:
      "Understand how the web works and build your first web pages.",
    order: 1,
  },
  {
    title: "JavaScript Fundamentals",
    slug: "javascript",
    description:
      "Learn modern JavaScript and core programming concepts.",
    order: 2,
  },
  {
    title: "Git & GitHub",
    slug: "git",
    description:
      "Learn version control and professional development workflows.",
    order: 3,
  },
  {
    title: "React Development",
    slug: "react",
    description:
      "Build modern component-based interfaces with React.",
    order: 4,
  },
  {
    title: "Node.js & Express",
    slug: "node",
    description:
      "Create backend services, REST APIs and server-side applications.",
    order: 5,
  },
  {
    title: "Databases & MongoDB",
    slug: "database",
    description:
      "Understand data modelling, databases and MongoDB.",
    order: 6,
  },
  {
    title: "Authentication & Security",
    slug: "authentication",
    description:
      "Implement authentication, authorization and secure applications.",
    order: 7,
  },
  {
    title: "Deployment & DevOps",
    slug: "deployment",
    description:
      "Deploy applications and understand modern DevOps fundamentals.",
    order: 8,
  },
];

const moduleLessons: Record<
  string,
  {
    title: string;
    slug: string;
    description: string;
    duration: string;
    type: "Lesson" | "Practice" | "Quiz";
    order: number;
  }[]
> = {
  "web-fundamentals": [
    {
      title: "HTML Fundamentals",
      slug: "html",
      description:
        "Learn the structure of modern HTML documents.",
      duration: "35 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "CSS Fundamentals",
      slug: "css",
      description:
        "Learn styling, selectors and layout fundamentals.",
      duration: "45 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "Responsive Web Design",
      slug: "responsive",
      description:
        "Build websites that work across different screen sizes.",
      duration: "40 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "Build Your First Web Page",
      slug: "web-practice",
      description:
        "Practice by creating a responsive web page.",
      duration: "30 min",
      type: "Practice",
      order: 4,
    },
  ],

  javascript: [
    {
      title: "JavaScript Basics",
      slug: "js-basics",
      description:
        "Learn variables, data types and JavaScript syntax.",
      duration: "45 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "Functions & Scope",
      slug: "functions",
      description:
        "Understand functions, scope and reusable logic.",
      duration: "40 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "Arrays & Objects",
      slug: "arrays",
      description:
        "Work with common JavaScript data structures.",
      duration: "45 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "Async JavaScript",
      slug: "async",
      description:
        "Understand promises, async/await and asynchronous code.",
      duration: "50 min",
      type: "Lesson",
      order: 4,
    },
    {
      title: "JavaScript Fundamentals Quiz",
      slug: "js-quiz",
      description:
        "Test your JavaScript fundamentals.",
      duration: "15 min",
      type: "Quiz",
      order: 5,
    },
  ],

  git: [
    {
      title: "Git Fundamentals",
      slug: "git-basics",
      description:
        "Learn the fundamentals of Git version control.",
      duration: "30 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "Branches & Merging",
      slug: "branches",
      description:
        "Work with branches and merge changes safely.",
      duration: "35 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "Working with GitHub",
      slug: "github",
      description:
        "Learn how GitHub fits into modern development workflows.",
      duration: "35 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "Create Your First Repository",
      slug: "git-practice",
      description:
        "Practice creating and managing a Git repository.",
      duration: "25 min",
      type: "Practice",
      order: 4,
    },
  ],

  react: [
    {
      title: "Introduction to React",
      slug: "react-intro",
      description:
        "Understand React and component-based development.",
      duration: "35 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "Components & Props",
      slug: "components",
      description:
        "Build reusable React components using props.",
      duration: "45 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "React Hooks",
      slug: "hooks",
      description:
        "Learn useState, useEffect and modern React Hooks.",
      duration: "50 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "State Management",
      slug: "state",
      description:
        "Understand local and shared application state.",
      duration: "45 min",
      type: "Lesson",
      order: 4,
    },
    {
      title: "Build a React Application",
      slug: "react-project",
      description:
        "Build a practical React application.",
      duration: "60 min",
      type: "Practice",
      order: 5,
    },
  ],

  node: [
    {
      title: "Introduction to Node.js",
      slug: "node-intro",
      description:
        "Understand Node.js and server-side JavaScript.",
      duration: "35 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "Express.js Fundamentals",
      slug: "express",
      description:
        "Build backend applications with Express.",
      duration: "45 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "Building REST APIs",
      slug: "rest-api",
      description:
        "Design and implement REST APIs.",
      duration: "50 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "Middleware & Error Handling",
      slug: "middleware",
      description:
        "Use middleware and handle API errors.",
      duration: "40 min",
      type: "Lesson",
      order: 4,
    },
    {
      title: "Build a REST API",
      slug: "api-project",
      description:
        "Build a production-style REST API.",
      duration: "75 min",
      type: "Practice",
      order: 5,
    },
  ],

  database: [
    {
      title: "Database Fundamentals",
      slug: "database-intro",
      description:
        "Understand databases, tables, documents and relationships.",
      duration: "35 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "MongoDB Fundamentals",
      slug: "mongodb",
      description:
        "Learn MongoDB databases and collections.",
      duration: "45 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "Mongoose & Data Models",
      slug: "mongoose",
      description:
        "Create MongoDB models using Mongoose.",
      duration: "45 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "Build a Database-Driven API",
      slug: "database-practice",
      description:
        "Connect a REST API to MongoDB.",
      duration: "60 min",
      type: "Practice",
      order: 4,
    },
  ],

  authentication: [
    {
      title: "Authentication Fundamentals",
      slug: "auth",
      description:
        "Understand authentication and identity.",
      duration: "40 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "JWT Authentication",
      slug: "jwt",
      description:
        "Implement token-based authentication.",
      duration: "45 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "Authorization & Roles",
      slug: "authorization",
      description:
        "Implement permissions and role-based access.",
      duration: "40 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "Web Security Fundamentals",
      slug: "security",
      description:
        "Understand common web security principles.",
      duration: "45 min",
      type: "Lesson",
      order: 4,
    },
  ],

  deployment: [
    {
      title: "Deployment Fundamentals",
      slug: "deployment",
      description:
        "Understand application deployment.",
      duration: "35 min",
      type: "Lesson",
      order: 1,
    },
    {
      title: "Docker Fundamentals",
      slug: "docker",
      description:
        "Learn the fundamentals of containerization.",
      duration: "45 min",
      type: "Lesson",
      order: 2,
    },
    {
      title: "Cloud Deployment",
      slug: "cloud",
      description:
        "Deploy applications to the cloud.",
      duration: "50 min",
      type: "Lesson",
      order: 3,
    },
    {
      title: "Deploy Your Full Stack Project",
      slug: "final-project",
      description:
        "Deploy your complete full-stack application.",
      duration: "90 min",
      type: "Practice",
      order: 4,
    },
  ],
};

export async function POST(
  request: Request
) {
  try {
    const user = await getCurrentUser();

    const seedSecret =
    process.env.ROADMAP_SEED_SECRET;

    const providedSecret =
    request.headers.get(
        "x-roadmap-seed-secret"
    );

    const isAdmin =
    user &&
    (user.role === "ADMIN" ||
        user.role === "SUPER_ADMIN");

    const isValidSeedRequest =
    seedSecret &&
    providedSecret &&
    providedSecret === seedSecret;

    if (!user && !isValidSeedRequest) {
    return NextResponse.json(
        {
        success: false,
        message: "Unauthorized",
        },
        { status: 401 }
    );
    }

    if (!isAdmin && !isValidSeedRequest) {
    return NextResponse.json(
        {
        success: false,
        message: "Forbidden",
        },
        { status: 403 }
    );
    }

    await connectDB();

    const createdRoadmaps = [];

    /*
     * ------------------------------------------------------
     * CREATE ROADMAPS
     * ------------------------------------------------------
     */

    for (const roadmapData of roadmaps) {
      let roadmap =
        await Roadmap.findOne({
          slug: roadmapData.slug,
        });

      if (!roadmap) {
        roadmap =
          await Roadmap.create(
            roadmapData
          );
      } else {
        roadmap =
          await Roadmap.findOneAndUpdate(
            {
              slug: roadmapData.slug,
            },
            roadmapData,
            {
              new: true,
              runValidators: true,
            }
          );
      }

      createdRoadmaps.push(
        roadmap
      );
    }

    /*
     * ------------------------------------------------------
     * FULL STACK MODULES
     * ------------------------------------------------------
     */

    const fullStack =
      await Roadmap.findOne({
        slug: "full-stack",
      });

    if (!fullStack) {
      throw new Error(
        "Full Stack roadmap was not created"
      );
    }

    for (const moduleData of fullStackModules) {
      let module =
        await Module.findOne({
          roadmap: fullStack._id,
          slug: moduleData.slug,
        });

      if (!module) {
        module =
          await Module.create({
            ...moduleData,
            roadmap:
              fullStack._id,
            published: true,
          });
      } else {
        module =
          await Module.findOneAndUpdate(
            {
              roadmap:
                fullStack._id,
              slug:
                moduleData.slug,
            },
            {
              ...moduleData,
              published: true,
            },
            {
              new: true,
              runValidators: true,
            }
          );
      }

      /*
       * ----------------------------------------------------
       * CREATE LESSONS
       * ----------------------------------------------------
       */

      const lessons =
        moduleLessons[
          moduleData.slug
        ] || [];

      for (const lessonData of lessons) {
        await Lesson.findOneAndUpdate(
          {
            module: module?._id,
            slug: lessonData.slug,
          },
          {
            ...lessonData,
            module:
              module?._id,
            published: true,
            content:
              getLessonContent(
                lessonData.slug
              ),
            videoUrl: "",
            codeExamples:
              getCodeExamples(
                lessonData.slug
              ),
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

        /*
         * Create practice data for
         * practice lessons.
         */

        if (
          lessonData.type ===
          "Practice"
        ) {
          const lesson =
            await Lesson.findOne({
              module:
                module?._id,
              slug:
                lessonData.slug,
            });

          if (lesson) {
            await Practice.findOneAndUpdate(
              {
                lesson:
                  lesson._id,
              },
              {
                lesson:
                  lesson._id,
                title:
                  lessonData.title,
                description:
                  lessonData.description,
                instructions:
                  getPracticeInstructions(
                    lessonData.slug
                  ),
                starterCode:
                  getStarterCode(
                    lessonData.slug
                  ),
                language:
                  "javascript",
                solutionCode:
                  "",
                hints: [],
                difficulty:
                  "Easy",
                published:
                  true,
              },
              {
                upsert: true,
                new: true,
                runValidators:
                  true,
              }
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Learning content seeded successfully",
      roadmaps:
        createdRoadmaps.map(
          (roadmap) => ({
            id: roadmap?._id,
            title:
              roadmap?.title,
            slug:
              roadmap?.slug,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Seed roadmaps error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to seed learning content",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| LESSON CONTENT
|--------------------------------------------------------------------------
*/

function getLessonContent(
  slug: string
) {
  const content: Record<
    string,
    string
  > = {
    html: `# HTML Fundamentals

HTML provides the structure of a web page.

In this lesson you will learn how HTML elements, attributes and document structure work.

## Basic HTML document

A standard HTML document contains a document type declaration, html element, head and body.

You will use these building blocks throughout your web development journey.`,

    css: `# CSS Fundamentals

CSS controls how HTML elements look and are positioned.

You will learn selectors, properties, spacing, typography and basic layouts.`,

    responsive: `# Responsive Web Design

Responsive design allows a website to adapt to different screen sizes.

You will learn flexible layouts, media queries and responsive design principles.`,

    "js-basics": `# JavaScript Basics

JavaScript adds behavior and interactivity to web applications.

You will learn variables, data types, operators and basic control flow.`,

    functions: `# Functions & Scope

Functions allow you to organize reusable pieces of logic.

You will learn function declarations, parameters, return values and scope.`,

    arrays: `# Arrays & Objects

Arrays and objects are two of the most important JavaScript data structures.

You will learn how to create, access and manipulate them.`,

    async: `# Async JavaScript

Modern applications frequently perform asynchronous operations.

You will learn Promises, async/await and asynchronous API requests.`,

    "git-basics": `# Git Fundamentals

Git is a distributed version control system.

You will learn repositories, commits, branches and basic Git workflows.`,

    branches: `# Branches & Merging

Branches allow developers to work on features independently.

You will learn how to create branches and merge changes.`,

    github: `# Working with GitHub

GitHub provides collaboration tools around Git repositories.

You will learn repositories, pull requests and collaborative workflows.`,

    "react-intro": `# Introduction to React

React is a JavaScript library for building user interfaces.

React encourages developers to divide applications into reusable components.`,

    components: `# Components & Props

Components are reusable building blocks of React applications.

Props allow data to be passed from one component to another.`,

    hooks: `# React Hooks

Hooks allow functional React components to use state and other React features.

You will learn useState, useEffect and the Rules of Hooks.`,

    state: `# State Management

State represents data that can change over time in an application.

You will learn how React manages and updates component state.`,

    "node-intro": `# Introduction to Node.js

Node.js allows JavaScript to run outside the browser.

It is commonly used to build APIs and backend services.`,

    express: `# Express.js Fundamentals

Express is a lightweight framework for Node.js applications.

You will learn routes, middleware and request handling.`,

    "rest-api": `# Building REST APIs

REST APIs provide a structured way for applications to communicate.

You will learn HTTP methods, status codes and API design.`,

    middleware: `# Middleware & Error Handling

Middleware functions can inspect and modify requests and responses.

You will also learn how to handle backend errors consistently.`,

    "database-intro": `# Database Fundamentals

Databases allow applications to store and retrieve persistent information.

You will learn the fundamentals of SQL and NoSQL databases.`,

    mongodb: `# MongoDB Fundamentals

MongoDB is a document-oriented NoSQL database.

You will learn databases, collections and documents.`,

    mongoose: `# Mongoose & Data Models

Mongoose provides schema-based modelling for MongoDB applications.

You will learn how to create models and validate data.`,

    auth: `# Authentication Fundamentals

Authentication verifies the identity of a user.

You will learn the basic concepts behind login systems and sessions.`,

    jwt: `# JWT Authentication

JSON Web Tokens are commonly used to represent authenticated sessions in APIs.

You will learn the basic JWT authentication flow.`,

    authorization: `# Authorization & Roles

Authorization determines what an authenticated user is allowed to do.

You will learn role-based access control.`,

    security: `# Web Security Fundamentals

Secure applications protect data, authentication systems and APIs.

You will learn common web security principles.`,

    deployment: `# Deployment Fundamentals

Deployment makes an application available outside your development environment.

You will learn the basic deployment lifecycle.`,

    docker: `# Docker Fundamentals

Docker packages applications and their dependencies into containers.

You will learn images, containers and basic Docker workflows.`,

    cloud: `# Cloud Deployment

Cloud platforms provide infrastructure for running applications.

You will learn the fundamentals of deploying web applications.`,
  };

  return (
    content[slug] ||
    `# ${slug}

Lesson content will be added soon.`
  );
}

/*
|--------------------------------------------------------------------------
| CODE EXAMPLES
|--------------------------------------------------------------------------
*/

function getCodeExamples(
  slug: string
) {
  const examples: Record<
    string,
    {
      title: string;
      language: string;
      code: string;
    }[]
  > = {
    html: [
      {
        title:
          "Basic HTML Document",
        language: "html",
        code: `<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>`,
      },
    ],

    "js-basics": [
      {
        title:
          "JavaScript Variables",
        language:
          "javascript",
        code: `const name = "Codelaunch";
let score = 100;

console.log(name);
console.log(score);`,
      },
    ],

    hooks: [
      {
        title:
          "useState Example",
        language:
          "javascript",
        code: `import { useState } from "react";

function Counter() {
  const [count, setCount] =
    useState(0);

  return (
    <button
      onClick={() =>
        setCount(count + 1)
      }
    >
      Count: {count}
    </button>
  );
}`,
      },
    ],

    express: [
      {
        title:
          "Express Route",
        language:
          "javascript",
        code: `import express from "express";

const app = express();

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello World"
  });
});

app.listen(3000);`,
      },
    ],

    mongodb: [
      {
        title:
          "MongoDB Document",
        language: "json",
        code: `{
  "name": "Codelaunch",
  "type": "learning-platform",
  "published": true
}`,
      },
    ],
  };

  return (
    examples[slug] || []
  );
}

/*
|--------------------------------------------------------------------------
| PRACTICE INSTRUCTIONS
|--------------------------------------------------------------------------
*/

function getPracticeInstructions(
  slug: string
) {
  const instructions: Record<
    string,
    string[]
  > = {
    "web-practice": [
      "Create a new HTML page.",
      "Add a navigation section.",
      "Add a main content section.",
      "Add responsive CSS.",
      "Make the page work on mobile devices.",
    ],

    "git-practice": [
      "Create a new Git repository.",
      "Create your first commit.",
      "Create a feature branch.",
      "Make a change and commit it.",
      "Merge the branch into main.",
    ],

    "react-project": [
      "Create a React application.",
      "Create reusable components.",
      "Add state using useState.",
      "Add user interaction.",
      "Build a polished final interface.",
    ],

    "api-project": [
      "Create an Express application.",
      "Create a REST endpoint.",
      "Add request validation.",
      "Return JSON responses.",
      "Handle API errors.",
    ],

    "database-practice": [
      "Create a MongoDB database.",
      "Create a data model.",
      "Connect the application to MongoDB.",
      "Create a POST endpoint.",
      "Create a GET endpoint.",
    ],

    "final-project": [
      "Prepare your full-stack application.",
      "Configure production environment variables.",
      "Build the production bundle.",
      "Deploy the frontend and backend.",
      "Verify the production application.",
    ],
  };

  return (
    instructions[slug] || [
      "Read the problem carefully.",
      "Implement the required functionality.",
      "Test your solution.",
      "Review your code.",
    ]
  );
}

/*
|--------------------------------------------------------------------------
| STARTER CODE
|--------------------------------------------------------------------------
*/

function getStarterCode(
  slug: string
) {
  const starterCode: Record<
    string,
    string
  > = {
    "web-practice": `<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>

  <body>
    <!-- Build your page here -->
  </body>
</html>`,

    "git-practice": `# Create your repository

git init

# Add your files

git add .

# Create your first commit

git commit -m "Initial commit"`,

    "react-project": `function App() {
  return (
    <main>
      {/* Build your React application */}
    </main>
  );
}

export default App;`,

    "api-project": `import express from "express";

const app = express();

app.use(express.json());

// Create your API routes here

app.listen(3000);`,

    "database-practice": `import mongoose from "mongoose";

await mongoose.connect(
  process.env.MONGODB_URI
);

// Create your model and API here`,

    "final-project": `# Production deployment checklist

1. Configure environment variables
2. Build the application
3. Deploy the application
4. Test production endpoints`,
  };

  return (
    starterCode[slug] || ""
  );
}