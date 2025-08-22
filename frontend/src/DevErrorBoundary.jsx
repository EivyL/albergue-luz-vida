// src/DevErrorBoundary.jsx
import { Component } from "react";
export default class DevErrorBoundary extends Component {
  constructor(p){ super(p); this.state={ hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ console.error("UI Error:", error, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{ padding:24, color:"#fee2e2", background:"#7f1d1d" }}>
          <h3>Se produjo un error en la UI</h3>
          <pre style={{ whiteSpace:"pre-wrap" }}>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
