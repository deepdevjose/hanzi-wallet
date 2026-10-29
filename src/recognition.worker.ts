/// <reference lib="webworker" />
import { recognize } from "./core/recognition";
import type { NeuralModel, CharacterTemplate, Stroke } from "./core/types";
let templates: CharacterTemplate[] = [];
let model: NeuralModel | null = null;
self.onmessage = (
  e: MessageEvent<
    | {
        type: "init";
        templates: CharacterTemplate[];
        model: NeuralModel | null;
      }
    | {
        type: "recognize";
        id: number;
        strokes: Stroke[];
        personal: Readonly<Record<string, readonly (readonly Stroke[])[]>>;
      }
  >,
) => {
  try {
    const data = e.data;
    if (data.type === "init") {
      templates = data.templates;
      model = data.model;
      self.postMessage({ type: "ready" });
    } else
      self.postMessage({
        type: "result",
        id: data.id,
        result: recognize(data.strokes, templates, model, data.personal),
      });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Error al reconocer.",
    });
  }
};
