import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/spotify"
import fetch from "node-fetch"

async function refreshAccessToken(token){
  try{
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token")
    params.append("refresh_token", token.refreshToken)

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        'Authorization': 'Basic ' + (new Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64'))
      },
      body: params
    })
    const refreshedToken = await response.json()
    return{
      ...token,
      accessToken: refreshedToken.access_token,
      accessTokenExpire: Date.now() + refreshedToken.expires_in * 1000,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken

    }
  }catch(error){
    console.error(error)
    return{
      ...token,
      error: "error refreshing token"
    }
  } 
}
const scopes = [
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative"
].join(",")

const params = {
  scopes: scopes
}

const query = new URLSearchParams(params)
const LOGIN_URL = "https://accounts.spotify.com/authorize?" + query.toString()

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_SECRET,
      authorization: LOGIN_URL
    }),
    // ...add more providers here
  ],

  secret: process.env.JWT_SECRET,
  pages:{
    signIn: "/login",
  },
  callbacks: {
    async jwt({token, account, user}){
      if (account && user){
        return{
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: account.providerAccountId,
          accessTokenExpire: account.expires_at * 10
        }
      }
      // if the token is valid
      if(Date.now() < token.accessTokenExpire){
        return token
      }

      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.user.accessToken = token.accessToken
      session.user.refreshToken = token.refreshToken
      session.user.username = token.username
      
      return session
    }
  }
}

export default NextAuth(authOptions)