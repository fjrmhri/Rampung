import { type NextRequest } from "next/server";
import { proxy } from "./src/proxy";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default async function middleware(request: NextRequest) {
  return await proxy(request);
}
