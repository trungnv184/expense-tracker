import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { bootstrap } from './data/bootstrap';
import { StorageUnavailable } from './ui/components/StorageUnavailable';
import './styles/tokens.css';
import './styles/base.css';

const root = createRoot(document.getElementById('root')!);

bootstrap().then((result) => {
  root.render(<StrictMode>{result.ok ? <App /> : <StorageUnavailable reason={result.reason} />}</StrictMode>);
});
