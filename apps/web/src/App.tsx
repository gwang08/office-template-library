import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LibraryPage } from './features/library/library-page';
import { DocumentsPage } from './features/documents/documents-page';
import { EditorPage } from './features/editor/editor-page';

// "/" is the template library (Phase 03). Phase 04 adds the document
// routes: the documents list and the DOCX editor (copy-on-use flow lands
// here straight from the preview modal's "Use template").
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id/edit" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
