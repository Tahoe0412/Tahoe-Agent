import { describe, expect, it } from "vitest";
import { z } from "zod";
import { classifyRouteError, parseJsonBody, parseOptionalJsonBody } from "@/lib/http-error";

describe("http-error helpers", () => {
  it("maps zod validation errors to 400", () => {
    const schema = z.object({
      title: z.string().min(1),
    });
    const parsed = schema.safeParse({});

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    expect(classifyRouteError(parsed.error)).toMatchObject({
      status: 400,
    });
  });

  it("maps not found errors to 404", () => {
    expect(classifyRouteError(new Error("Project not found."))).toEqual({
      status: 404,
      detail: "Project not found.",
    });
  });

  it("rejects invalid json request bodies", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: "{broken",
      headers: { "content-type": "application/json" },
    });

    await expect(parseJsonBody(request)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("accepts empty optional json bodies", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: "",
      headers: { "content-type": "application/json" },
    });

    await expect(parseOptionalJsonBody(request, { mode: "full" })).resolves.toEqual({
      mode: "full",
    });
  });
});
