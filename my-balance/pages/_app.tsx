import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Nav from '../components/Nav'
import BackgroundAnimation from '../components/BackgroundAnimation'

function MyApp(props: AppProps) {
  const { Component, pageProps } = props ?? {}
  if (!Component) {
    return <div>Loading...</div>
  }
  return (
    <>
      <BackgroundAnimation />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'visible' }}>
        <Nav />
        <div style={{ flex: 1, minHeight: 0 }}>
          <Component {...pageProps} />
        </div>
      </div>
    </>
  )
}

export default MyApp
