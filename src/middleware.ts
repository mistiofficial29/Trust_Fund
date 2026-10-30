import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (!path.startsWith("/dashboard")) return true;
      if (!token) return false;
      if (path.startsWith("/dashboard/admin")) return token.role === "ADMIN";
      if (path.startsWith("/dashboard/ngo")) return token.role === "NGO";
      if (path.startsWith("/dashboard/donor")) return token.role === "DONOR";
      return Boolean(token);
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
