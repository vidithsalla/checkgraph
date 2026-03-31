import { NextResponse } from "next/server";
import { exportSupportSummaryMarkdown } from "@/lib/domain/support/export-markdown";
import { exportSupportSummaryText } from "@/lib/domain/support/export-text";
import { generateSupportSummary } from "@/lib/domain/support/generate-support-summary";
import { loadCheckDetail } from "@/lib/server/checks/load-check-detail";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ checkId: string }> },
) {
  const { checkId } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "markdown";
  const detail = await loadCheckDetail(checkId);

  if (!detail) {
    return new NextResponse("Check not found", { status: 404 });
  }

  const summary = generateSupportSummary(detail);

  if (format === "text") {
    return new NextResponse(exportSupportSummaryText(summary), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  return new NextResponse(exportSupportSummaryMarkdown(summary), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
