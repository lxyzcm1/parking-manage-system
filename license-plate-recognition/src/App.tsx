import PlateRecognition from './components/PlateRecognition'
import './App.css'

function App() {
  return (
    <div className="App">
      <PlateRecognition onRecognized={(plate) => console.log(plate)} />
    </div>
  )
}

export default App