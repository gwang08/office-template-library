import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LibraryPage } from './features/library/library-page';
import { DocumentsPage } from './features/documents/documents-page';
import { PptxDocumentPage } from './features/documents/pptx-document-page';
import { EditorPage } from './features/editor/editor-page';

// "/" is the template library (Phase 03). Phase 04 adds the documents list
// and the DOCX editor (copy-on-use lands here from "Use template"). Phase 05b
// adds /documents/:id — the PPTX workspace (slides + download); each route
// guards the other's kind, so a docx never shows on the slides page and a
// pptx never reaches the editor.
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<PptxDocumentPage />} />
        <Route path="/documents/:id/edit" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
