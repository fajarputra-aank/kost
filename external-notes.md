

## Gemini Veo documentation used for platform presets

Official sources consulted: [Google AI Veo guide](https://ai.google.dev/gemini-api/docs/veo) and [Gemini video generation overview](https://ai.google.dev/gemini-api/docs/video). The official Veo guide documents the REST `predictLongRunning` flow, `x-goog-api-key` header, polling the returned operation, downloading `.response.generateVideoResponse.generatedSamples[0].video.uri`, and portrait/landscape `aspectRatio` values `9:16` and `16:9`. Its capability table documents `durationSeconds` values `4`, `6`, and `8`, with 720p support; higher resolutions require 8 seconds. The implementation keeps 720p and restricts selectable duration to 4/6/8 seconds.
