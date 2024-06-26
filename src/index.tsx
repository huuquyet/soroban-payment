import { inject } from '@vercel/analytics'
import ReactDOM from 'react-dom/client'
import { SendPayment } from './components/send-payment'

import '@stellar/design-system/build/styles.min.css'
import './index.scss'

const root = ReactDOM.createRoot(document.getElementById('root')!)
inject()
root.render(<SendPayment />)
