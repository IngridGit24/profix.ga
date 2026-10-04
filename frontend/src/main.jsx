import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'semantic-ui-css/components/reset.min.css'
import 'semantic-ui-css/components/site.min.css'
import 'semantic-ui-css/components/button.min.css'
import 'semantic-ui-css/components/card.min.css'
import 'semantic-ui-css/components/dropdown.min.css'
import 'semantic-ui-css/components/form.min.css'
import 'semantic-ui-css/components/input.min.css'
import 'semantic-ui-css/components/label.min.css'
import 'semantic-ui-css/components/menu.min.css'
import 'semantic-ui-css/components/message.min.css'
import 'semantic-ui-css/components/modal.min.css'
import 'semantic-ui-css/components/segment.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
