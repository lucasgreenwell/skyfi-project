# UX Flow Document: Report Generation Feature

## Overview

This document describes the user experience flow for generating a report. A user can trigger report generation via two different paths:
- **Image Upload:** The user uploads one or multiple images, is immediately taken to the image viewer, and must then click "Generate" to create a report.
- **Text Query:** The user enters a natural language query and submits it, which triggers report generation immediately using images retrieved from the existing database.

In both cases, the generated report will consist of associated images and a text summary, which will then be displayed in the UI.

---

## Flow 1a: Image Upload-Based Report Generation

1. **Image Upload**
   - **Action:** The user navigates to the upload section of the UI.
   - **Process:** The user selects and uploads one or more images.
   - **Outcome:** 
     - The images are displayed immediately in the image viewer as previews.
     - No report is generated at this point.
     
2. **Report Generation Trigger**
   - **Action:** The user reviews the uploaded images and clicks the "Generate" button.
   - **Process:** The system sends a request to the designated image upload endpoint.
   - **Outcome:** The backend processes the uploaded images and generates a report.

3. **Report Display**
   - **Action:** Once the report is generated, the UI is updated.
   - **Process:** 
     - The central image viewer displays the processed images with any vessel annotations.
     - A report sidebar (on the right) displays the text summary of the report.
   - **Outcome:** The complete report (images and text) is shown to the user.

---

## Flow 1b: Text Query-Based Report Generation

1. **Text Query Input**
   - **Action:** The user navigates to the chat input component.
   - **Process:** The user types a natural language query (e.g., “Show me all vessels in [area] and classify them”) into the input field.
   
2. **Submit Query**
   - **Action:** The user submits the query by clicking the "Submit" button.
   - **Process:** 
     - The system immediately sends the query to the text query endpoint.
     - The system retrieves relevant images from the existing database based on the query.
   - **Outcome:** Report generation is triggered immediately without additional user input.

3. **Report Generation and Display**
   - **Action:** The system processes the text query.
   - **Process:** 
     - The backend generates a report that includes a structured text summary along with the retrieved images.
     - The report is then sent back to the frontend.
   - **Outcome:** 
     - The central image viewer displays the images with annotations.
     - The report sidebar (on the right) shows the text summary.
     - The chat bar remains anchored for continuous interaction.

---

## Endpoint Differentiation

- **Image Upload Endpoint:**  
  - **Trigger:** Activated when the user clicks "Generate" after uploading images.
  - **Function:** Processes the uploaded images to generate a report.
  
- **Text Query Endpoint:**  
  - **Trigger:** Activated immediately upon submission of a text query.
  - **Function:** Retrieves images from the existing database and generates a report on the fly.

---

## Common UI Behavior

1. **Initial Navigation:**
   - Users see the upload section and chat input upon landing on the page.
   - The image viewer and report sidebar remain hidden until a report is generated.

2. **Post-Interaction Layout:**
   - **For Image Uploads:** After uploading images and clicking "Generate," the UI transitions to display:
     - The image viewer (centered) showing the uploaded images.
     - The report sidebar (anchored to the right) with the generated text report.
     - The chat bar is anchored near the bottom for further interaction.
   - **For Text Queries:** Immediately after submitting the query:
     - The UI updates to show the image viewer with images retrieved from the database.
     - The report sidebar displays the generated text report.
     - The chat bar remains anchored at the bottom.

3. **Consistency and Feedback:**
   - Regardless of the trigger path, the final report presentation remains consistent, displaying both images and a text summary.
   - Visual cues (such as loaders or progress indicators) are shown during the report generation process.

---

## Conclusion

This UX flow ensures that users have a clear and consistent experience whether they are uploading images or entering text queries. The system differentiates between the two endpoints for report generation while maintaining a uniform display of the final report—comprising associated images and a text summary—in the UI.
