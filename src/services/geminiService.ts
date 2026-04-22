import type { ImageAsset, Layer } from '../store/useProjectStore';

export const generateImage = async (
  apiKey: string,
  targetImage: ImageAsset,
  layers: Layer[],
  overallPrompt: string
): Promise<ImageAsset> => {
  const parts: any[] = [];

  parts.push({ text: `Base Instruction: ${overallPrompt}` });

  const extractBase64 = (dataUrl: string) => {
    return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  };

  const extractMimeType = (dataUrl: string, fallback: string) => {
    const match = dataUrl.match(/^data:(.+?);base64/);
    return match ? match[1] : fallback;
  };

  parts.push({
    inlineData: {
      mimeType: targetImage.mimeType || extractMimeType(targetImage.fileData, 'image/jpeg'),
      data: extractBase64(targetImage.fileData),
    }
  });

  let layerIndex = 1;
  for (const layer of layers) {
    if (!layer.isVisible || !layer.maskImage) continue;

    parts.push({ text: `Layer ${layerIndex} Prompt: ${layer.prompt}` });
    parts.push({ text: `Layer ${layerIndex} Mask:` });

    parts.push({
      inlineData: {
        mimeType: layer.maskImage.mimeType || extractMimeType(layer.maskImage.fileData, 'image/png'),
        data: extractBase64(layer.maskImage.fileData)
      }
    });

    layerIndex++;
  }

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
