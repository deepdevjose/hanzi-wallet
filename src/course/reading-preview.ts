import type { CourseLesson, CourseText } from "../core/course";
import { INTRODUCING_YOURSELF } from "./introducing-yourself";

// A separate snapshot keeps preview reading evidence distinct from the future
// listening mission, including sessions already pinned to its original version.
const fixture = structuredClone(INTRODUCING_YOURSELF);
const name = fixture.exercises.find(
  (exercise) => exercise.id === "listen-name",
);
if (!name || name.type !== "choice")
  throw new Error("The reading preview needs the name-choice fixture");
const text = (
  es: string,
  en: string,
  zh: string,
  fr: string,
  pt: string,
): CourseText => ({ es, en, "zh-CN": zh, fr, pt });

/** Editorial reading preview. Pending audio is never used to grade listening. */
export const READING_PREVIEW: CourseLesson = {
  ...fixture,
  id: "introducing-yourself-reading-preview",
  version: "0.1.0",
  status: "draft",
  linguisticReview: "pending",
  objective: text(
    "Leer una presentación y ordenar una pregunta sobre el nombre.",
    "Read an introduction and arrange a question about someone's name.",
    "阅读自我介绍，并排列询问名字的句子。",
    "Lire une présentation et remettre une question sur le nom dans l'ordre.",
    "Ler uma apresentação e ordenar uma pergunta sobre o nome.",
  ),
  exercises: [
    {
      id: "read-name",
      type: "choice",
      skill: "reading",
      target: name.target,
      prompt: text(
        "Lee la presentación. ¿Cómo se llama esta persona?",
        "Read the introduction. What is this person's name?",
        "阅读自我介绍，这个人叫什么名字？",
        "Lis la présentation. Comment cette personne s'appelle-t-elle ?",
        "Leia a apresentação. Qual é o nome desta pessoa?",
      ),
      explanation: text(
        "El texto dice «我叫李明»: se llama Li Ming.",
        "The text says 我叫李明: their name is Li Ming.",
        "文字中写着“我叫李明”：这个人叫李明。",
        "Le texte dit 我叫李明 : cette personne s'appelle Li Ming.",
        "O texto diz 我叫李明: o nome da pessoa é Li Ming.",
      ),
      options: name.options,
      answerId: name.answerId,
    },
    ...fixture.exercises.filter(
      (exercise) =>
        exercise.id === "read-jiao" || exercise.id === "order-question",
    ),
  ],
};

/** Imported snapshots stay resumable only when this renderer supports them. */
export function supportsReadingPreview(lesson: CourseLesson): boolean {
  return (
    lesson.id === READING_PREVIEW.id &&
    lesson.exercises.length > 0 &&
    lesson.exercises.every(
      (exercise) =>
        exercise.skill === "reading" &&
        (exercise.type === "choice" || exercise.type === "order"),
    )
  );
}
