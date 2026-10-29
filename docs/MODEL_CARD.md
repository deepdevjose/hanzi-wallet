# Model card: ink-mlp v1

## Intended use

Interactive recognition of a single handwritten character from the bundled **151-character** vocabulary. The user confirms the intended character; the app can then compare shape, order, and direction against a canonical template. A prediction by itself does not establish that a character was written correctly.

## Architecture

Input: 609 float features. A 24 × 24 maximum Gaussian occupancy raster (576 features), a 24-bin capped stroke-count indicator, eight trajectory-direction bins, and one aspect-ratio feature. Points are normalized with preserved aspect ratio and centred inside a 78% square. Strokes are resampled along arc length before rasterization.

Classifier: dense network **609 → 192 → 96 → 64 → 151**, ReLU hidden activations and softmax output. It is a deep multilayer perceptron, not a CNN. Exported weights are rounded to six decimal places. The small plain-TypeScript inference engine avoids a runtime TensorFlow download and has numerical parity fixtures against Python.

The deployed recognizer blends an uncalibrated neural score with stroke geometry. Sixteen coarse geometric candidates, twelve neural candidates, and up to eight personalized candidates form a deduplicated shortlist. Sequence alignment and dynamic time warping rerank it. Neural inference and reranking run in a dedicated worker.

## Data and preparation

Source: `hanzi-writer-data@2.0.1`, derived from Make Me a Hanzi and Arphic fonts. The full source-data licence is bundled. The 151 selected outlines and medians are checked in, with original outlines retained and median coordinates transformed to a downward-y plane.

The vocabulary was adapted from the supplied Hanzi Studio prototype. Its duplicate 没 entry was removed; 安 was added so the final vocabulary has 151 unique characters. Each class has one canonical template and 55 generated variations: 8,456 training samples in total. Variations include anisotropic scale, small rotation, stroke offset, resampling, and smoothed point jitter. These are **synthetic pen trajectories**, not independent human examples.

Training uses scikit-learn's Adam MLP with early stopping. The random seed is `20261029`; the evaluation augmentation seed is `888`. Training holds out 12% of synthetic samples for early stopping. A separate evaluation run uses eight fresh perturbations per character, at higher perturbation severity.

## Measured results

The checked-in classifier achieved **96.03% top-1** and **99.83% top-5** on **1,208 held-out synthetic augmentations**. Exact values, seeds, and sample counts are recorded in [`public/model/metrics.json`](../public/model/metrics.json).

These numbers measure the neural classifier only. They do not measure the full hybrid pipeline on independent handwriting, do not compare fairly with the original font CNN, and must not be advertised as real-user accuracy. All synthetic splits share the same underlying canonical character templates. That shared source makes this an optimistic benchmark.

The application's similarity score is a heuristic retrieval score. Softmax values are not calibrated posterior probabilities. No score should be interpreted as a probability that a character is linguistically correct.

## Rejection and assessment

Tiny accidental marks, empty canvases, excessive stroke counts, and low geometric matches are rejected. Some unsupported marks still resemble supported characters; this is an open-set limitation. The interface presents alternatives and asks users to compare.

Guided assessment passes only when the stroke count matches, normalized shape is above its tolerance, **all strokes match the canonical order**, and **all match its direction**. Shape matching permits moderate variation. The template's canonical stroke order is not a complete reference for every accepted regional or calligraphic variant.

## Personalization

The user explicitly confirms an example for a selected character. Up to five examples per character are retained locally and used as geometric prototypes. This updates retrieval, not the pretrained neural weights. Examples can be exported in the progress backup. The app sends no ink to an inference or training service.

## Limitations and next evaluation

- Only the bundled simplified characters are supported. Multi-character words, cursive joins, traditional forms, and arbitrary Chinese characters are outside the vocabulary.
- No independent human handwriting benchmark or user study has been collected.
- Script style, stroke segmentation, device noise, left-handed writing, motor differences, and uncommon accepted stroke orders can change performance.
- Template-derived synthetic examples cannot model the full range of human handwriting.
- Personal examples help only for characters the user has explicitly confirmed and can also reinforce a wrongly labelled example.

Before expanding accuracy claims: collect consented, separately licensed human samples from multiple writers and devices; keep writers disjoint between training and test; report per-class confusion, top-k recall, open-set rejection, direction/order errors, and median/p95 interaction latency. An imported pretrained handwritten-character model should be checked for its licence, vocabulary mapping, normalization, and independent evaluation before replacing this one.

## Reproduction

See the README. The repository includes exact source templates, augmentation code, pinned Python requirements, exported weights, metrics, and parity fixtures. Retraining does not require a user account or private dataset.
