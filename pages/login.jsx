import React from "react";
import { signIn } from 'next-auth/react'

const Login = () => {
  return (
    <div className = "w-full h-screen flex itemm-center justify-center">
      <button onClick={()=> {
        signIn('spotify', {callbackUrl: "/"})
      }}>Login with Spotify</button>
    </div>
  )
}

export default Login;