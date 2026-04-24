# 🍌 Masked Banana

**Try it at** masked-banana.web.app

**Masked Banana** is a modern, single-page web application (SPA) built with React and Vite. It provides a Photoshop-like layered masking experience directly in the browser, allowing you to seamlessly integrate your creativity with the **Gemini API** for powerful multimodal AI image editing.

## ✨ Features

- **Interactive Canvas**: Pan, zoom, and manipulate your target image smoothly.
- **Layered Masking**: Add multiple transparent layers on top of your base image.
  - **Tools**: Draw masks using freehand brushes, rectangles, or ellipses.
  - **Customization**: Adjust brush sizes and select distinct colors for different layer masks.
- **Multimodal AI Integration**: 
  - Provide specific text prompts for individual masked layers.
  - Provide an overall prompt for the entire image.
  - Send the base image, generated masks, and prompts to the Gemini API to receive an AI-edited result.
- **Project Persistence**: 
  - **Export** your entire workspace (image, layers, masks, and tools) to a `.zip` file.
  - **Import** your project `.zip` file later to pick up exactly where you left off.
- **Save Results**: Download your AI-generated images locally with native file system prompts.
- **Bring Your Own Key (BYOK)**: Securely input your own Gemini API key in the browser to start generating—no backend secrets required.

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Canvas/Drawing**: [React Konva](https://konvajs.org/docs/react/index.html)
- **Icons**: [Lucide React](https://lucide.dev/)
- **File Handling**: [JSZip](https://stuk.github.io/jszip/)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/masked-banana.git
   cd masked-banana
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Usage
1. Click the **API Settings** button in the top left and input your Gemini API Key.
2. Upload a target image to the main canvas.
3. Add a new layer using the **Layers** panel on the right.
4. Select a tool (Brush, Rectangle, Ellipse) from the left toolbar and draw your mask.
5. Provide a specific prompt for your masked layer in the bottom-right panel.
6. Provide an overall prompt for the image in the bottom panel.
7. Click **Generate** to let the Gemini API work its magic!

## 📦 Building for Production

To build the application for production:

```bash
npm run build
```

This will generate optimized static files in the `dist` directory, which can be easily hosted on Firebase App Hosting, Vercel, Netlify, or any other static hosting provider. Refer to the `doc/PRODUCTIONIZE.md` file for details on deploying to Firebase App Hosting.

## 📄 Documentation

- [Design Document](doc/DESIGN.md)
- [Implementation Details](doc/IMPLEMENTATION.md)
