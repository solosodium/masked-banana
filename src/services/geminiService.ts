import type { ImageAsset, Layer } from '../store/useProjectStore';

export const generateImage = async (
  apiKey: string,
  targetImage: ImageAsset,
  layers: Layer[],
  overallPrompt: string
): Promise<ImageAsset> => {

  const extractBase64 = (dataUrl: string) => {
    return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  };

  const extractMimeType = (dataUrl: string, fallback: string) => {
    const match = dataUrl.match(/^data:(.+?);base64/);
    return match ? match[1] : fallback;
  };

  const parts: any[] = [];

  const basePrompt = [
    '## General Instruction',
    'You are a professional image editing assistant.',
    'You will receive a series of images with this text prompt.',
    'The images contains a base image to be edited, followed by a series of layer masks.',
    'The first image is the base image, and the second image is the first layer mask, the third image is the second layer mask, and so on.',
    'The layer mask image is in png with transparent background, and the white pixels represents the mask.',
    'When using the layer mask for editing, you should line up the mask with the base image to ensure the editing is done in the masked area.',
    'You will first get a series of prompts specific to each layer mask, and you will edit the base image according to the layer mask and the prompt.',
    'After that, you will receive a prompt specific to the base image, which will instruct you to edit the entire base image.'
  ].join('\n');

  parts.push({ text: basePrompt });

  let layerIndex = 1;
  for (const layer of layers) {
    if (!layer.isVisible || !layer.maskImage) continue;

    parts.push({
      inlineData: {
        mimeType: layer.maskImage.mimeType || extractMimeType(layer.maskImage.fileData, 'image/png'),
        data: extractBase64(layer.maskImage.fileData)
      }
    });

    parts.push({ text: `## Layer ${layerIndex} Instruction\n${layer.prompt}` });

    layerIndex++;
  }

  parts.push({ text: `## Base Image Instruction\n${overallPrompt}` });

  parts.push({
    inlineData: {
      mimeType: targetImage.mimeType || extractMimeType(targetImage.fileData, 'image/jpeg'),
      data: extractBase64(targetImage.fileData),
    }
  });

  const payload = {
    contents: [
      {
        parts: parts
      }
    ]
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini API");
  }

  const firstPart = data.candidates[0].content.parts[0];

  if (firstPart.inlineData) {
    const rawMimeType = firstPart.inlineData.mimeType || 'image/jpeg';

    // Strict verification to prevent latent XSS vectors via malicious text/html data URIs
    if (!rawMimeType.startsWith('image/') || rawMimeType.includes(';')) {
      throw new Error("Received an invalid or unsafe MIME type from the Gemini API.");
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      fileData: `data:${rawMimeType};base64,${firstPart.inlineData.data}`,
      width: targetImage.width,
      height: targetImage.height
    };
  } else if (firstPart.text) {
    // Attempt to extract base64 data URI if returned in string
    const match = firstPart.text.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (match) {
      return {
        id: Math.random().toString(36).substring(2, 9),
        fileData: match[0],
        width: targetImage.width,
        height: targetImage.height
      };
    } else {
      throw new Error("Received text instead of an image from Gemini API.");
    }
  }

  throw new Error("Unexpected response structure from Gemini API");
};
