import { NextResponse } from "next/server";
import { z } from "zod";
import { getPreviewAccessEnabled, getPreviewAccessPassword } from "@/lib/env";

const accessSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!getPreviewAccessEnabled()) {
    return NextResponse.json({ success: true });
  }

  const password = getPreviewAccessPassword();
  if (!password) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "访问保护已开启，但服务端未配置访问口令。",
        },
      },
      { status: 500 },
    );
  }

  const body = accessSchema.parse(await request.json());
  if (body.password !== password) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "访问口令不正确。",
        },
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("ai_video_ops_preview_access", password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
