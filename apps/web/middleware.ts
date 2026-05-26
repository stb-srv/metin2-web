import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: { signIn: "/login" }
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/storage/:path*",
    "/itemshop/:path*",
    "/admin/:path*",
  ]
}
