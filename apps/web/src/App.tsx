import { LibraryPage } from './features/library/library-page';

// "/" is the template library (Phase 03). The preview modal is page-level,
// route-agnostic — no router yet; later phases add editor/document routes.
export function App() {
  return <LibraryPage />;
}
