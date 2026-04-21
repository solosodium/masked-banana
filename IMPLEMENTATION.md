# Masked Banana Implementation Document

Based on the requirements and research outlined in `DESIGN.md`, this document details the implementation strategy for the single-page web application.

## 1. Technology Stack Choices
*   **Web Framework**: **React + Vite**. Vite provides a substantially faster development experience compared to Create React App and avoids the Server-Side Rendering (SSR) complexities of Next.js, which are unnecessary for a purely client-side local editor. It easily compiles into a static SPA suitable for hosting on Firebase, Vercel, or GitHub Pages.
*   **UI & Styling**: **Tailwind CSS**. Allows for rapid styling without leaving the component context. For a Photoshop-like interface, we will configure a custom dark theme within `tailwind.config.js` to provide a professional, unobtrusive workspace.
*   **Canvas Engine**: **react-konva** (Konva.js). For managing multiple layers, object positioning (pan/zoom), and freehand drawing, a scene-graph library like Konva is much more performant and easier to reason about in React than raw Canvas manipulation. It has built-in optimizations for complex layer masking.
*   **State Management**: **Zustand**. A complex image editing application requires deeply nested and interactive states. Zustand is a small, fast, and scalable bearbones state-management solution that avoids Redux boilerplate while integrating seamlessly with React hooks.
*   **API Key Management**: **Browser `localStorage`**. Since this is a Bring Your Own Key (BYOK) client-sided app, keys will be securely collected via a UI modal and stored locally in `localStorage`. The key will be injected into API headers dynamically and never transmitted to a third-party server.

## 2. Detailed Data Structures for Project State

The core state will manage assets as `DataURL` strings or Blob URLs for fast previewing and serialization.

```typescript
// Define primitive shapes and drawings for the mask
type Point = { x: number; y: number };

type MaskStroke = {
  id: string;
  type: 'freehand' | 'rectangle' | 'ellipse';
  color: string;           // Visual aid color
  brushSize?: number;      // For freehand
  points?: Point[];        // For freehand
  x?: number; y?: number; width?: number; height?: number; // For shapes
  radiusX?: number; radiusY?: number; // For ellipse
  mode: 'draw' | 'erase';  // maps to 'source-over' or 'destination-out'
};

type ImageAsset = {
  id: string;
  fileData: string; // Base64 encoding of the image
  width: number;
  height: number;
};

type Layer = {
  id: string;
  name: string;
  isVisible: boolean;
  maskStrokes: MaskStroke[];
  inspirationImages: ImageAsset[];
  prompt: string;
  usePredefinedPrompt: boolean;
  predefinedPromptId?: string;
};

// Main Zustand Store Structure
type ProjectState = {
  version: '1.0';
  targetImage: ImageAsset | null;
  overallPrompt: string;
  layers: Layer[];
  canvasView: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  generatedImage: ImageAsset | null;
  
  // Actions will be bound to the store (e.g., addLayer, updateMask, etc.)
};
```

## 3. Gemini Nano Banana API Usage Plan

"Nano Banana" refers to the Gemini model variants targeted toward high-efficiency visual editing (e.g., Gemini Flash Image or Pro Image). 
Since the application relies entirely on precise multimodal editing via API:
1. **Mask Extraction**: Upon clicking "Generate", the frontend will use Konva's `toDataURL()` on specific mask layers to generate isolated black-and-white or transparent-PNG masks.
2. **Payload Construction**: 
   * Aggregate the instructions. The prompt structure will be parameterized: `Base Instruction: [overallPrompt]. Layer 1: Apply [Layer 1 Prompt] to [Mask 1] referencing [Inspiration 1]. ...`
   * Construct a multipart or schema-based JSON request where parts include the inline Base64 data of `targetImage`, `Mask Images`, and `Inspiration Images`.
3. **API Call**: Use `fetch`/axios directly against the Google REST API (`https://generativelanguage.googleapis.com/v1beta/models/...:generateContent`) passing the BYOK key via the `x-goog-api-key` header.
4. **Resolution**: Receive the binary/base64 output of the generated image, load it into an `ImageAsset` object, and visualize it in a final comparison canvas.

## 4. Detailed UI Design (Wireframes & Mockups)

The layout uses a 3-pane vertical-split architecture, typical of pro-grade creative tools (Dark Theme: Background `#18181b`, Panels `#27272a`).

### Top Navigation Bar
*   **Left**: App Logo / Title.
*   **Center**: Tooltip messages / Current status.
*   **Right**: "API Key Settings" button (opens Modal), "Export/Import Project" buttons.

### Left Sidebar: Tools Panel
*   **Selection & Workspace**: Move/Pan tool, Zoom in/out.
*   **Masking**: Brush Tool, Eraser Tool (with a dynamic slider for Brush Size mapping to stroke width).
*   **Shapes**: Rectangle Draw, Ellipse Draw.
*   **Settings**: Mask Color picker for visual differentiation.

### Center Workspace: The Canvas
*   Uses `react-konva` for interactive rendering.
*   Displays the `targetImage` as the bottom-most graphical node.
*   Maps over active `layers` and renders their `maskStrokes` with partial opacity so users can see the image underneath.
*   Bottom strip contains a wide text input for the `overallPrompt` and a prominent, vibrant "Generate Image" button.

### Right Sidebar: Layers & Prompts Panel
*   **Layer Stack**: A sortable list structure (drag-to-reorder via `dnd-kit`). Each item shows a visibility (eye) toggle, name, and delete button.
*   **Active Layer Details**: When a layer is highlighted:
    *   A prompt textarea (or dropdown for predefined prompts).
    *   A grid drop-zone to upload or drag-and-drop `inspirationImages`.

## 5. Detailed Implementation Plan (Step-by-Step)

### Phase 1: Environment & Scaffolding
1.  Run `npx create-vite@latest masked-banana --template react-ts`.
2.  Install core dependencies: `tailwindcss`, `react-konva`, `konva`, `zustand`, `lucide-react` (icons), `jszip` (for export/import).
3.  Configure Tailwind for a custom dark theme extension.
4.  Scaffold the 3-pane layout (`ToolBar.tsx`, `Workspace.tsx`, `PropertyPanel.tsx`).

### Phase 2: State & Core Interaction
1.  Initialize the Zustand store (`useProjectStore.ts`) with the `ProjectState` interface.
2.  Build the BYOK prompt modal; save/retrieve the key on initial component mount using `localStorage`.
3.  Create the file upload handler for the `targetImage` and render it using a `Konva.Image` node located at the center of the Stage.
4.  Implement Stage pan `(draggable, onDragMove)` and scale `(onWheel)`.

### Phase 3: Drawing and Layering Mechanics
1.  Implement the Layers Panel UI to map over `state.layers`. Implement adding/removing layers.
2.  Attach event listeners `onMouseDown`, `onMouseMove`, `onMouseUp` to the Konva Stage to record points into `maskStrokes` for the current active layer.
3.  Map over `maskStrokes` to render `<Line>`, `<Rect>`, or `<Ellipse>` Konva components depending on the tool selected.
4.  Wire up the eraser tool by toggling `globalCompositeOperation` to `destination-out`.

### Phase 4: API & Multimodal Generation
1.  Build an export utility that takes a targeted layer, renders only its mask data to an off-screen canvas, and generates a Base64 PNG.
2.  Create the `geminiService.ts` to construct the intricate multimodal prompt.
3.  Add an `isGenerating` loading overlay to the UI.
4.  Make the authenticated fetch request, parse the base64 response image, and display it above the target image layer.

### Phase 5: Persistence & Polish
1.  Implement `exportProject()` using `jszip`. Serialize the Zustand state to heavily compress Base64 assets into actual binary files inside the zip, and write a pointing `project.json`.
2.  Implement `importProject()` to unpack the zip and hydrate the Zustand store.
3.  Test responsiveness and edge cases (e.g., missing API key warnings, empty target images, out-of-bounds layer drawing).
