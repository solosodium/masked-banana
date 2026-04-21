# Masked Banana Design Document

This design document describes the high level requirements and research topics to guide the development of a single page web applciation that allows user to use photoshop-like layered masks to tell Gemini Nano Banana what to edit in an image.

## High Level Requirements

### Single page web application

The final product should be a single page web application. The only external dependency is the Gemini Nano Banana API. The framework has to be based on react.js. Consider use popular frameworks like Next.js to build the application. The application should be hosted easily on services like Firebase without extensive configuration.

**RESEARCH**:
* Research popular single page web application frameworks, analyze the pros and cons of each framework, and choose the best one for this project. Take into consideration of ease of development, ease of deployment, and performance.

### BYOK

The application should support BYOK (Bring Your Own Key). This means that the user should be able to provide their own API key to the application. The API key should be stored securely in the application and should be used to make requests to the Gemini Nano Banana API.

**RESEARCH**:
* Research popular API key management solutions, analyze the pros and cons of each solution, and choose the best one for this project. Take into consideration of security, ease of use, and performance.

### Support masked image editing

The application should support photoshop style masked image editing. This means the user should be able to:
* Upload a target image for editing;
* Visualize the target image in the main canvas;
* Pan, zoom, rotate, and crop the target image in the main canvas;
* Add multiple transparent layers on top of the target image in the main canvas;
* Within each layer, user can:
    * Draw/erase by free hand on the transparent layers with different brush sizes and a custom mask color;
    * Draw/erase with rectangle and eclipse shapes on the transparent layers with a custom mask color;
    * Upload/drag-drop/delete inspiration images to work with the the layer and mask;
    * Use either a predefined prompt or a custom prompt for the layer and mask;
    * Toggle to enable/disable the layer and mask;
* Reorder layers;
* Delete layers;
* Add/edit an overall prompt for the target image in addition to the layer prompts;
* Click to send target image, each layer mask, inspiration images, and prompts to the Gemini Nano Banana API;
* Receive the edited image from the Gemini Nano Banana API;
* Visualize the edited image in the main canvas;
* Save the edited image to the local file system;
* Export the entire project as a .json file with image files in a zip file.
* Import a .json file with image files in a zip file to restore the project.

**RESEARCH**:
* The main canvas should allow fairly complex image manipulation with user interaction. Research popular techniques for implementing such a canvas, analyze the pros and cons of each technique, and choose the best one for this project.
* Design a sophiscated data structure to represent the project state, including the target image, layers, masks, inspiration images, and prompts. Justify your design choices.

### Gemini Nano Banana API

We will use the Gemini Nano Banana API to edit images. The API should support uploading multiple images with one of them as the target image and others as masks and inspiration images, and the aggregated prompts from the target image level and each layer level.

**RESEARCH**:
* Research the Gemini Nano Banana API documentation, and figure out which model and which APIs this application should use. Copy the API documentation and link the sources.

### User Interface

The UI should look modern and clean. It should be easy to use and understand. It should be responsive and work on different screen sizes. The main purpose of the UI is to allow user to:
* First set a Gemini Nano Banana API key; and then
* Go to the main canvas to start editing images.

**RESEARCH**:
* Research popular UI frameworks for React.js, analyze the pros and cons of each framework, and choose the best one for this project. I personally prefer Tailwind CSS, but I am open to other suggestions.
* The color scheme is really important for this application. Research the best color schemes for image editing applications, and justify your reasoning.

## Actions

With the research above, create a detailed `IMPLEMENTATION.md` document that includes:
* Technology stack choices with justifications;
* Detailed data structures for the project state;
* Detailed API usage plan for the Gemini Nano Banana API;
* Detailed UI design with wireframes and mockups;
* Detailed implementation plan with step-by-step instructions.
