import { NextRequest } from "next/server";
import * as handlers from "../admin/[module]/route";
const context = { params: Promise.resolve({ module: "clients" }) };
export const GET = (req: NextRequest) => handlers.GET(req, context);
export const POST = (req: NextRequest) => handlers.POST(req, context);
