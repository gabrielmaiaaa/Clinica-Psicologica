import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, RouterProvider} from 'react-router-dom'

import CreateUser from './Componentes/Auth/CreateUser.jsx'
import LoginUser from './Componentes/Auth/LoginUser.jsx'
import PaginaInicial from './Componentes/Home/PaginaInicial.jsx'
import EnviarRelato from './Componentes/Relato/EnviarRelato.jsx'
import ConsultarConsulta from './Componentes/Consulta/ConsultarConsulta.jsx'
import CadastrarConsulta from './Componentes/Consulta/CadastrarConsulta.jsx'

const routes = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <LoginUser />
      },
      {
        path: 'cadastro',
        element: <CreateUser />
      }
    ]
  },
  {
    path: '/pagina-inicial',
    element: <PaginaInicial />
  },
  {
    path: '/enviar-relato',
    element: <EnviarRelato />
  },
  {
    path: '/consultas',
    element: <ConsultarConsulta />
  },
  {
    path: '/cadastraConsulta',
    element: <CadastrarConsulta />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={routes}/>
)