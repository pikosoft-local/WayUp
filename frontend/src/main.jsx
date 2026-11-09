import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Szukamy elementu root i montujemy w nim główny komponent Reacta.
createRoot(document.getElementById('root')).render(
  // StrictMode pomaga wykrywać problemy w trybie deweloperskim.
  <StrictMode>
    <App />
  </StrictMode>,
)
