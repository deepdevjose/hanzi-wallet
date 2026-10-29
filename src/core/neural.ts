import type { NeuralModel } from "./types";
export function infer(model: NeuralModel, input: Float32Array): Float32Array {
  if (input.length !== model.features)
    throw new Error("La entrada no coincide con el modelo.");
  let value = input;
  for (const layer of model.layers) {
    if (
      layer.input !== value.length ||
      layer.weights.length !== layer.input * layer.output ||
      layer.biases.length !== layer.output
    )
      throw new Error("Pesos del modelo inválidos.");
    const out = new Float32Array(layer.output);
    for (let i = 0; i < layer.input; i++) {
      const v = value[i]!;
      if (v === 0) continue;
      const offset = i * layer.output;
      for (let j = 0; j < layer.output; j++)
        out[j] = out[j]! + v * layer.weights[offset + j]!;
    }
    for (let j = 0; j < out.length; j++) out[j] = out[j]! + layer.biases[j]!;
    if (layer.activation === "relu") {
      for (let j = 0; j < out.length; j++) out[j] = Math.max(0, out[j]!);
    } else {
      const max = Math.max(...out);
      let sum = 0;
      for (let j = 0; j < out.length; j++) {
        out[j] = Math.exp(out[j]! - max);
        sum += out[j]!;
      }
      for (let j = 0; j < out.length; j++) out[j] = out[j]! / sum;
    }
    value = out;
  }
  return value;
}
