import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DocumentAccessView } from './components/DocumentAccessView';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname.startsWith('/document/access/') ? <DocumentAccessView /> : <App />}
  </StrictMode>,
);
