# Comfortable AI browser model

Comfortable AI uses the browser-ready ONNX build of Qwen2.5-0.5B-Instruct from the Hugging Face ONNX Community:

onnx-community/Qwen2.5-0.5B-Instruct
https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct

The model is loaded in the browser with Transformers.js. WebGPU uses q4f16 when available; otherwise the app uses q4.

The model weights are not copied into this GitHub Pages repository. The q4f16 ONNX file is about 483 MB, which is above GitHub's 100 MiB regular Git file limit, and Git LFS cannot be used by GitHub Pages. The app therefore downloads the model from Hugging Face when needed.

License: Apache-2.0 for Qwen2.5-0.5B-Instruct.

The app keeps its built-in features such as greetings, riddles, stories, medical safety replies, chats, settings, backgrounds, voice, and typo recognition. The browser model handles general open-ended messages and the final fallback in the Talk mode.
