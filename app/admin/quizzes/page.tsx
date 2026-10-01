"use client";

import {
  Plus,
  Trash2,
  Save,
  Send,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

interface QuizLesson {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  type: string;
  duration?: string;
  order: number;
  published: boolean;

  quiz: {
    _id: string;
    passingScore: number;
    published: boolean;
    questionCount: number;
  } | null;
}

interface QuizModule {
  _id: string;
  title: string;
  description?: string;
  order: number;
  published?: boolean;
  lessons: QuizLesson[];
}

interface Roadmap {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  level?: string;
  duration?: string;
  published?: boolean;
  modules: QuizModule[];
}

interface QuizOption {
  text: string;
  value: string;
}

interface QuizQuestion {
  _id?: string;
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

const createOption = (
  value: string
): QuizOption => ({
  value,
  text: "",
});

const createQuestion = (
  order: number
): QuizQuestion => ({
  question: "",
  options: [
    createOption("A"),
    createOption("B"),
    createOption("C"),
    createOption("D"),
  ],
  correctAnswer: "A",
  explanation: "",
  order,
});

export default function AdminQuizzesPage() {
  const [roadmaps, setRoadmaps] =
    useState<Roadmap[]>([]);

  const [selectedRoadmapId, setSelectedRoadmapId] =
    useState("");

  const [selectedModuleId, setSelectedModuleId] =
    useState("");

  const [selectedLessonId, setSelectedLessonId] =
    useState("");

  const [questions, setQuestions] =
    useState<QuizQuestion[]>([
      createQuestion(1),
    ]);

  const [passingScore, setPassingScore] =
    useState(70);

  const [published, setPublished] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [quizLoading, setQuizLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * ------------------------------------------------------
   * CREATE QUIZ LESSON STATE
   * ------------------------------------------------------
   */

  const [showCreateLesson, setShowCreateLesson] =
    useState(false);

  const [newLessonTitle, setNewLessonTitle] =
    useState("");

  const [newLessonDescription, setNewLessonDescription] =
    useState("");

  const [newLessonDuration, setNewLessonDuration] =
    useState("15 min");

  const [creatingLesson, setCreatingLesson] =
    useState(false);

  /*
   * ------------------------------------------------------
   * LOAD ROADMAPS
   * ------------------------------------------------------
   */

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/admin/quizzes",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load quiz data"
          );
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              "Unable to load quiz data"
          );
        }

        console.log(
          "[ADMIN QUIZZES] API RESULT:",
          result
        );

        console.log(
          "[ADMIN QUIZZES] ROADMAPS:",
          result.roadmaps
        );

        setRoadmaps(
          result.roadmaps || []
        );
      } catch (err) {
        console.error(
          "[ADMIN QUIZZES] LOAD ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load quiz data"
        );
      } finally {
        setLoading(false);
      }
    }

    loadRoadmaps();
  }, []);

  /*
   * ------------------------------------------------------
   * SELECTED ROADMAP
   * ------------------------------------------------------
   */

  const selectedRoadmap =
    useMemo(() => {
      return roadmaps.find(
        (roadmap) =>
          String(
            roadmap._id
          ) ===
          String(
            selectedRoadmapId
          )
      );
    }, [
      roadmaps,
      selectedRoadmapId,
    ]);

  /*
   * ------------------------------------------------------
   * SELECTED MODULE
   * ------------------------------------------------------
   */

  const selectedModule =
    useMemo(() => {
      return selectedRoadmap?.modules.find(
        (module) =>
          String(
            module._id
          ) ===
          String(
            selectedModuleId
          )
      );
    }, [
      selectedRoadmap,
      selectedModuleId,
    ]);

  /*
   * ------------------------------------------------------
   * SELECTED LESSON
   * ------------------------------------------------------
   */

  const selectedLesson =
    useMemo(() => {
      return selectedModule?.lessons.find(
        (lesson) =>
          String(
            lesson._id
          ) ===
          String(
            selectedLessonId
          )
      );
    }, [
      selectedModule,
      selectedLessonId,
    ]);

  /*
   * ------------------------------------------------------
   * LOAD EXISTING QUIZ
   * ------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedLessonId) {
      setQuestions([
        createQuestion(1),
      ]);

      setPassingScore(70);
      setPublished(false);

      return;
    }

    let cancelled = false;

    async function loadQuiz() {
      try {
        setQuizLoading(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `/api/admin/quizzes/${selectedLessonId}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load quiz"
          );
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              "Unable to load quiz"
          );
        }

        if (
          !cancelled &&
          result.quiz
        ) {
          const loadedQuestions =
            Array.isArray(
              result.quiz.questions
            )
              ? [...result.quiz.questions]
                  .sort(
                    (
                      a: QuizQuestion,
                      b: QuizQuestion
                    ) =>
                      a.order -
                      b.order
                  )
                  .map(
                    (
                      question: QuizQuestion,
                      index: number
                    ) => ({
                      ...question,

                      question:
                        question.question ||
                        "",

                      explanation:
                        question.explanation ||
                        "",

                      order:
                        question.order ||
                        index + 1,

                      options:
                        Array.isArray(
                          question.options
                        ) &&
                        question.options.length
                          ? question.options
                          : [
                              createOption(
                                "A"
                              ),
                              createOption(
                                "B"
                              ),
                              createOption(
                                "C"
                              ),
                              createOption(
                                "D"
                              ),
                            ],
                    })
                  )
              : [];

          setQuestions(
            loadedQuestions.length
              ? loadedQuestions
              : [
                  createQuestion(1),
                ]
          );

          setPassingScore(
            result.quiz.passingScore ??
              70
          );

          setPublished(
            result.quiz.published ??
              false
          );
        } else if (
          !cancelled
        ) {
          setQuestions([
            createQuestion(1),
          ]);

          setPassingScore(70);
          setPublished(false);
        }
      } catch (err) {
        console.error(
          "[ADMIN QUIZ] LOAD ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load quiz"
          );
        }
      } finally {
        if (!cancelled) {
          setQuizLoading(false);
        }
      }
    }

    loadQuiz();

    return () => {
      cancelled = true;
    };
  }, [selectedLessonId]);

  /*
   * ------------------------------------------------------
   * CREATE QUIZ LESSON
   * ------------------------------------------------------
   */

  async function createQuizLesson() {
    if (!selectedRoadmapId) {
      setError(
        "Please select a roadmap."
      );

      return;
    }

    if (!selectedModuleId) {
      setError(
        "Please select a module."
      );

      return;
    }

    if (!newLessonTitle.trim()) {
      setError(
        "Please enter a quiz title."
      );

      return;
    }

    try {
      setCreatingLesson(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          "/api/admin/quizzes/lessons",
          {
            method: "POST",
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              roadmapId:
                selectedRoadmapId,

              moduleId:
                selectedModuleId,

              title:
                newLessonTitle.trim(),

              description:
                newLessonDescription.trim(),

              duration:
                newLessonDuration.trim(),
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to create quiz lesson"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to create quiz lesson"
        );
      }

      /*
       * Refresh admin quiz data
       */

      const refreshResponse =
        await fetch(
          "/api/admin/quizzes",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const refreshResult =
        await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(
          refreshResult.message ||
            "Quiz lesson created but data refresh failed"
        );
      }

      if (!refreshResult.success) {
        throw new Error(
          refreshResult.message ||
            "Quiz lesson created but data refresh failed"
        );
      }

      setRoadmaps(
        refreshResult.roadmaps || []
      );

      /*
       * Select newly created lesson
       */

      const createdLessonId =
        String(
          result.lesson._id
        );

      setSelectedLessonId(
        createdLessonId
      );

      /*
       * Reset modal
       */

      setNewLessonTitle("");
      setNewLessonDescription("");
      setNewLessonDuration("15 min");
      setShowCreateLesson(false);

      setSuccess(
        "Quiz lesson created successfully. You can now add questions."
      );
    } catch (err) {
      console.error(
        "[ADMIN QUIZ LESSON] CREATE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create quiz lesson"
      );
    } finally {
      setCreatingLesson(false);
    }
  }

  /*
   * ------------------------------------------------------
   * SELECT ROADMAP
   * ------------------------------------------------------
   */

  function handleRoadmapChange(
    value: string
  ) {
    setSelectedRoadmapId(value);

    setSelectedModuleId("");
    setSelectedLessonId("");

    setQuestions([
      createQuestion(1),
    ]);

    setPassingScore(70);
    setPublished(false);

    setSuccess("");
    setError("");
  }

  /*
   * ------------------------------------------------------
   * SELECT MODULE
   * ------------------------------------------------------
   */

  function handleModuleChange(
    value: string
  ) {
    setSelectedModuleId(value);

    setSelectedLessonId("");

    setQuestions([
      createQuestion(1),
    ]);

    setPassingScore(70);
    setPublished(false);

    setSuccess("");
    setError("");
  }

  /*
   * ------------------------------------------------------
   * UPDATE QUESTION
   * ------------------------------------------------------
   */

  function updateQuestion(
    index: number,
    field: keyof QuizQuestion,
    value: string | number
  ) {
    setQuestions(
      (current) =>
        current.map(
          (
            question,
            questionIndex
          ) =>
            questionIndex === index
              ? {
                  ...question,
                  [field]:
                    value,
                }
              : question
        )
    );

    setSuccess("");
  }

  /*
   * ------------------------------------------------------
   * UPDATE OPTION
   * ------------------------------------------------------
   */

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string
  ) {
    setQuestions(
      (current) =>
        current.map(
          (
            question,
            index
          ) => {
            if (
              index !==
              questionIndex
            ) {
              return question;
            }

            return {
              ...question,
              options:
                question.options.map(
                  (
                    option,
                    currentOptionIndex
                  ) =>
                    currentOptionIndex ===
                    optionIndex
                      ? {
                          ...option,
                          text: value,
                        }
                      : option
                ),
            };
          }
        )
    );

    setSuccess("");
  }

  /*
   * ------------------------------------------------------
   * SET CORRECT ANSWER
   * ------------------------------------------------------
   */

  function setCorrectAnswer(
    questionIndex: number,
    value: string
  ) {
    setQuestions(
      (current) =>
        current.map(
          (
            question,
            index
          ) =>
            index === questionIndex
              ? {
                  ...question,
                  correctAnswer:
                    value,
                }
              : question
        )
    );

    setSuccess("");
  }

  /*
   * ------------------------------------------------------
   * ADD QUESTION
   * ------------------------------------------------------
   */

  function addQuestion() {
    setQuestions(
      (current) => [
        ...current,
        createQuestion(
          current.length + 1
        ),
      ]
    );

    setSuccess("");
  }

  /*
   * ------------------------------------------------------
   * REMOVE QUESTION
   * ------------------------------------------------------
   */

  function removeQuestion(
    index: number
  ) {
    if (
      questions.length === 1
    ) {
      return;
    }

    setQuestions(
      (current) =>
        current
          .filter(
            (_, questionIndex) =>
              questionIndex !==
              index
          )
          .map(
            (
              question,
              questionIndex
            ) => ({
              ...question,
              order:
                questionIndex + 1,
            })
          )
    );

    setSuccess("");
  }

  /*
   * ------------------------------------------------------
   * SAVE QUIZ
   * ------------------------------------------------------
   */

  async function saveQuiz(
    shouldPublish: boolean
  ) {
    if (!selectedLessonId) {
      setError(
        "Please select a Quiz lesson."
      );

      return;
    }

    if (
      questions.length === 0
    ) {
      setError(
        "Add at least one question."
      );

      return;
    }

    /*
     * Validate passing score
     */

    if (
      Number.isNaN(
        passingScore
      ) ||
      passingScore < 0 ||
      passingScore > 100
    ) {
      setError(
        "Passing score must be between 0 and 100."
      );

      return;
    }

    /*
     * Validate questions
     */

    for (
      let index = 0;
      index <
      questions.length;
      index++
    ) {
      const question =
        questions[index];

      if (
        !question.question.trim()
      ) {
        setError(
          `Question ${
            index + 1
          } is empty.`
        );

        return;
      }

      if (
        question.options.length <
        2
      ) {
        setError(
          `Question ${
            index + 1
          } needs at least two options.`
        );

        return;
      }

      const hasEmptyOption =
        question.options.some(
          (option) =>
            !option.text.trim()
        );

      if (hasEmptyOption) {
        setError(
          `Please fill all options for question ${
            index + 1
          }.`
        );

        return;
      }

      const optionValues =
        question.options.map(
          (option) =>
            option.value
        );

      if (
        !optionValues.includes(
          question.correctAnswer
        )
      ) {
        setError(
          `Please select a correct answer for question ${
            index + 1
          }.`
        );

        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/quizzes/${selectedLessonId}`,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              questions,

              passingScore,

              published:
                shouldPublish,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to save quiz"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
            "Unable to save quiz"
        );
      }

      /*
       * Update local state
       */

      setPublished(
        shouldPublish
      );

      /*
       * SUCCESS MESSAGE
       */

      setSuccess(
        shouldPublish
          ? "Quiz saved and published successfully."
          : "Quiz saved successfully."
      );

      /*
       * Refresh roadmap data so the
       * question count / published
       * state is immediately updated.
       */

      try {
        const refreshResponse =
          await fetch(
            "/api/admin/quizzes",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const refreshResult =
          await refreshResponse.json();

        if (
          refreshResponse.ok &&
          refreshResult.success
        ) {
          setRoadmaps(
            refreshResult.roadmaps ||
              []
          );
        }
      } catch (refreshError) {
        console.warn(
          "[ADMIN QUIZ] REFRESH WARNING:",
          refreshError
        );
      }
    } catch (err) {
      console.error(
        "[ADMIN QUIZ] SAVE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save quiz"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------------
   * LOADING
   * ------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2
            size={24}
            className="animate-spin text-white/40"
          />
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------
   * PAGE
   * ------------------------------------------------------
   */

  return (
    <div className="mx-auto max-w-7xl pb-16">

      {/* HEADER */}

      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/30">
          Administration
        </div>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quiz Management
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Create, edit and publish quizzes for your learning roadmap.
            </p>
          </div>

          {selectedLesson?.quiz && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-2 text-xs text-white/40">

              <CheckCircle2
                size={14}
              />

              Existing Quiz ·{" "}
              {
                selectedLesson
                  .quiz
                  .questionCount
              }{" "}
              questions

            </div>
          )}

        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-white/60">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">

          <CheckCircle2
            size={16}
            className="shrink-0 text-white"
          />

          <span>
            {success}
          </span>

        </div>
      )}

      {/* SELECTORS */}

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6">

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ROADMAP */}

          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              Roadmap
            </label>

            <div className="relative mt-2">

              <select
                value={
                  selectedRoadmapId
                }
                onChange={(event) =>
                  handleRoadmapChange(
                    event.target.value
                  )
                }
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-white/25"
              >

                <option
                  value=""
                  className="bg-black"
                >
                  Select roadmap
                </option>

                {roadmaps.map(
                  (roadmap) => (
                    <option
                      key={
                        roadmap._id
                      }
                      value={
                        roadmap._id
                      }
                      className="bg-black"
                    >
                      {
                        roadmap.title
                      }
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
              />

            </div>
          </div>

          {/* MODULE */}

          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              Module
            </label>

            <div className="relative mt-2">

              <select
                value={
                  selectedModuleId
                }
                onChange={(event) =>
                  handleModuleChange(
                    event.target.value
                  )
                }
                disabled={
                  !selectedRoadmap
                }
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <option
                  value=""
                  className="bg-black"
                >
                  Select module
                </option>

                {selectedRoadmap?.modules.map(
                  (module) => (
                    <option
                      key={
                        module._id
                      }
                      value={
                        module._id
                      }
                      className="bg-black"
                    >
                      {
                        module.title
                      }
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
              />

            </div>
          </div>

          {/* QUIZ LESSON */}

          <div>

            <label className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              Quiz Lesson
            </label>

            <div className="relative mt-2">

              <select
                value={
                  selectedLessonId
                }
                onChange={(event) => {
                  setSelectedLessonId(
                    event.target.value
                  );

                  setError("");
                  setSuccess("");
                }}
                disabled={
                  !selectedModule
                }
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <option
                  value=""
                  className="bg-black"
                >
                  Select quiz lesson
                </option>

                {selectedModule?.lessons.map(
                  (lesson) => (
                    <option
                      key={
                        lesson._id
                      }
                      value={
                        lesson._id
                      }
                      className="bg-black"
                    >
                      {
                        lesson.title
                      }
                      {" — "}
                      {
                        lesson.type
                      }
                    </option>
                  )
                )}

              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
              />

            </div>

            {/* CREATE QUIZ LESSON */}

            {selectedModule && (
              <button
                type="button"
                onClick={() => {
                  setShowCreateLesson(
                    true
                  );

                  setError("");
                  setSuccess("");
                }}
                className="mt-3 inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-white/80"
              >
                <Plus
                  size={14}
                />

                Create Quiz Lesson
              </button>
            )}

          </div>

        </div>

      </div>

      {/* QUIZ EDITOR */}

      {selectedLessonId && (
        <div className="mt-6">

          {/* QUIZ SETTINGS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <div className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                  Quiz Settings
                </div>

                <h2 className="mt-2 text-lg font-semibold">
                  {
                    selectedLesson?.title
                  }
                </h2>

                {selectedLesson?.type && (
                  <p className="mt-1 text-xs text-white/30">
                    Lesson type:{" "}
                    {
                      selectedLesson.type
                    }
                  </p>
                )}

              </div>

              <div className="flex items-center gap-3">

                <label className="text-xs text-white/35">
                  Passing Score
                </label>

                <input
                  type="number"
                  min={0}
                  max={100}
                  value={
                    passingScore
                  }
                  onChange={(event) =>
                    setPassingScore(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  className="w-20 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center text-sm text-white outline-none focus:border-white/25"
                />

                <span className="text-xs text-white/30">
                  %
                </span>

              </div>

            </div>

          </div>

          {/* QUESTIONS */}

          {quizLoading ? (
            <div className="mt-6 flex min-h-[250px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025]">

              <Loader2
                size={22}
                className="animate-spin text-white/30"
              />

            </div>
          ) : (
            <div className="mt-6 space-y-5">

              {questions.map(
                (
                  question,
                  questionIndex
                ) => (
                  <div
                    key={
                      question._id ||
                      `new-${questionIndex}`
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"
                  >

                    {/* QUESTION HEADER */}

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                          Question{" "}
                          {
                            questionIndex +
                            1
                          }
                        </div>

                      </div>

                      {questions.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeQuestion(
                              questionIndex
                            )
                          }
                          className="rounded-lg border border-white/10 p-2 text-white/30 transition hover:bg-white/5 hover:text-white/60"
                          title="Remove question"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
                      )}

                    </div>

                    {/* QUESTION TEXT */}

                    <textarea
                      value={
                        question.question
                      }
                      onChange={(
                        event
                      ) =>
                        updateQuestion(
                          questionIndex,
                          "question",
                          event.target
                            .value
                        )
                      }
                      rows={3}
                      placeholder="Enter the question..."
                      className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
                    />

                    {/* OPTIONS */}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => (
                          <div
                            key={
                              option.value
                            }
                            className="flex items-center gap-3"
                          >

                            <button
                              type="button"
                              onClick={() =>
                                setCorrectAnswer(
                                  questionIndex,
                                  option.value
                                )
                              }
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs transition ${
                                question.correctAnswer ===
                                option.value
                                  ? "border-white/40 bg-white text-black"
                                  : "border-white/10 bg-white/5 text-white/30 hover:text-white/60"
                              }`}
                              title="Set correct answer"
                            >
                              {
                                option.value
                              }
                            </button>

                            <input
                              type="text"
                              value={
                                option.text
                              }
                              onChange={(
                                event
                              ) =>
                                updateOption(
                                  questionIndex,
                                  optionIndex,
                                  event.target
                                    .value
                                )
                              }
                              placeholder={`Option ${option.value}`}
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/25"
                            />

                          </div>
                        )
                      )}

                    </div>

                    {/* CORRECT ANSWER INFO */}

                    <div className="mt-4 text-[10px] text-white/25">
                      Correct answer:{" "}
                      <span className="text-white/60">
                        {
                          question.correctAnswer
                        }
                      </span>
                    </div>

                    {/* EXPLANATION */}

                    <textarea
                      value={
                        question.explanation
                      }
                      onChange={(
                        event
                      ) =>
                        updateQuestion(
                          questionIndex,
                          "explanation",
                          event.target
                            .value
                        )
                      }
                      rows={2}
                      placeholder="Optional explanation shown after the quiz..."
                      className="mt-5 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/25"
                    />

                  </div>
                )
              )}

              {/* ADD QUESTION */}

              <button
                type="button"
                onClick={
                  addQuestion
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-4 text-xs text-white/35 transition hover:border-white/20 hover:bg-white/[0.025] hover:text-white/60"
              >
                <Plus size={15} />

                Add Question
              </button>

            </div>
          )}

          {/* ACTIONS */}

          {!quizLoading && (
            <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:flex-row sm:items-center">

              <div>

                <p className="text-xs text-white/40">
                  {
                    questions.length
                  }{" "}
                  question
                  {questions.length ===
                  1
                    ? ""
                    : "s"}
                </p>

                <p className="mt-1 text-[10px] text-white/20">
                  Click A, B, C or D to select the correct answer.
                </p>

                {published && (
                  <p className="mt-2 flex items-center gap-1.5 text-[10px] text-white/50">
                    <CheckCircle2
                      size={12}
                    />
                    Published
                  </p>
                )}

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    saveQuiz(false)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >

                  {saving ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={14}
                    />
                  )}

                  Save Draft

                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    saveQuiz(true)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  {saving ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Send
                      size={14}
                    />
                  )}

                  Publish Quiz

                </button>

              </div>

            </div>
          )}

        </div>
      )}

      {/* EMPTY STATE */}

      {!selectedLessonId &&
        !error && (
          <div className="mt-6 flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025]">

            <div className="text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/30">
                <Plus size={18} />
              </div>

              <h2 className="mt-5 text-sm font-semibold">
                Select a Quiz Lesson
              </h2>

              <p className="mt-2 max-w-sm text-xs leading-5 text-white/30">
                Choose a roadmap, module and quiz lesson to start creating or editing its questions.
              </p>

            </div>

          </div>
        )}

      {/* CREATE QUIZ LESSON MODAL */}

      {showCreateLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0d16] p-6 shadow-2xl">

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                  New Quiz
                </div>

                <h2 className="mt-2 text-xl font-semibold">
                  Create Quiz Lesson
                </h2>

                <p className="mt-2 text-xs leading-5 text-white/30">
                  Create a quiz lesson inside the selected module.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateLesson(
                    false
                  )
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>

            </div>

            {/* FORM */}

            <div className="mt-6 space-y-5">

              {/* TITLE */}

              <div>

                <label className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                  Quiz Title
                </label>

                <input
                  type="text"
                  value={
                    newLessonTitle
                  }
                  onChange={(event) =>
                    setNewLessonTitle(
                      event.target.value
                    )
                  }
                  placeholder="React Development Quiz"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                  Description
                </label>

                <textarea
                  value={
                    newLessonDescription
                  }
                  onChange={(event) =>
                    setNewLessonDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Test your React knowledge."
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
                />

              </div>

              {/* DURATION */}

              <div>

                <label className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                  Duration
                </label>

                <input
                  type="text"
                  value={
                    newLessonDuration
                  }
                  onChange={(event) =>
                    setNewLessonDuration(
                      event.target.value
                    )
                  }
                  placeholder="15 min"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
                />

              </div>

            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                disabled={
                  creatingLesson
                }
                onClick={() =>
                  setShowCreateLesson(
                    false
                  )
                }
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  creatingLesson
                }
                onClick={
                  createQuizLesson
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >

                {creatingLesson ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />

                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={14} />

                    Create Quiz Lesson
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}