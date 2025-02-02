import Versions from './components/Versions'
import YouTubePlayer from './YouTubePlayer'

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  console.log(ipcHandle)

  const playlistId = 'RDCLAK5uy_lRr2S1Nmk-a4qeSFpU0WoLuVETphGyBP8'

  return (
    <>
      <YouTubePlayer playlistId={playlistId} />
      <Versions />
    </>
  )
}

export default App
