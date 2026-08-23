import { Provider } from 'react-redux'
import { store } from '~/store'

import './App.css'
import World from './components/World/world'

function App() {
  return (
    <Provider store={store}>
      <World />
    </Provider>
  )
}

export default App