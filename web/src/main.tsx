import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<main className="worker-page"><h1>Something went wrong.</h1><p>Your saved updates are still on the server. Reload to reconnect.</p><button onClick={()=>location.reload()}>Reload Fieldnote</button></main>:this.props.children}}
ReactDOM.createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
