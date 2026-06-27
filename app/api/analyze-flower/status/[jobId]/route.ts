import { NextResponse } from "next/server";
import { getAnalysisJob, getAnalysisResult, isRedisEnabled } from "@/lib/floraiRedis";
import {
  getWorkerResultErrorMessage,
  getWorkerResultStatus,
  normalizeWorkerResult,
  type AnalyzeStatusResponse,
} from "@/lib/floraiAnalysisContracts";
import { debugLog } from "@/lib/floraiDebug";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;

  debugLog("STATUS_REQUEST_RECEIVED", {
    jobId,
    redisEnabled: isRedisEnabled(),
  });

  if (!isRedisEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        mode: "redis",
        jobId,
        status: "failed",
        error: {
          code: "REDIS_DISABLED",
          message: "REDIS_URL 또는 FLORAI_REDIS_URL이 설정되어 있지 않습니다.",
        },
      } satisfies AnalyzeStatusResponse,
      { status: 503 },
    );
  }

  try {
    const rawResult = await getAnalysisResult(jobId);
    if (rawResult) {
      debugLog("STATUS_RAW_RESULT_FOUND", { jobId, rawResult });

      const workerStatus = getWorkerResultStatus(rawResult);

      if (workerStatus === "queued" || workerStatus === "processing" || workerStatus === "running") {
        const response = {
          ok: true,
          mode: "redis",
          jobId,
          status: "processing",
        } satisfies AnalyzeStatusResponse;

        debugLog("STATUS_WORKER_PROCESSING_RESPONSE", response);
        return NextResponse.json(response);
      }

      if (workerStatus === "failed" || workerStatus === "error") {
        const response = {
          ok: false,
          mode: "redis",
          jobId,
          status: "failed",
          error: {
            code: "WORKER_FAILED",
            message: getWorkerResultErrorMessage(rawResult),
            detail: rawResult,
          },
        } satisfies AnalyzeStatusResponse;

        debugLog("STATUS_WORKER_FAILED_RESPONSE", response);
        return NextResponse.json(response);
      }

      const result = normalizeWorkerResult(rawResult);
      if (!result) {
        const response = {
          ok: false,
          mode: "redis",
          jobId,
          status: "failed",
          error: {
            code: "INVALID_WORKER_RESULT",
            message:
              "worker 결과를 화면용 분석 결과로 변환하지 못했습니다. Redis result JSON의 prediction/description 형식을 확인해 주세요.",
            detail: rawResult,
          },
        } satisfies AnalyzeStatusResponse;

        debugLog("STATUS_INVALID_WORKER_RESULT_RESPONSE", response);
        return NextResponse.json(response);
      }

      const response = {
        ok: true,
        mode: "redis",
        jobId,
        status: "completed",
        result,
      } satisfies AnalyzeStatusResponse;

      debugLog("STATUS_COMPLETED_RESPONSE", response);

      return NextResponse.json(response);
    }

    const job = await getAnalysisJob(jobId);
    debugLog("STATUS_JOB_LOOKUP", {
      jobId,
      found: Boolean(job),
      job,
    });

    if (!job) {
      return NextResponse.json(
        {
          ok: false,
          mode: "redis",
          jobId,
          status: "not_found",
          error: {
            code: "JOB_NOT_FOUND",
            message: "해당 jobId를 찾을 수 없습니다. TTL이 만료되었거나 등록에 실패했을 수 있습니다.",
          },
        } satisfies AnalyzeStatusResponse,
        { status: 404 },
      );
    }

    const response = {
      ok: true,
      mode: "redis",
      jobId,
      status: "queued",
    } satisfies AnalyzeStatusResponse;

    debugLog("STATUS_QUEUED_RESPONSE", response);

    return NextResponse.json(response);
  } catch (error) {
    debugLog("STATUS_FETCH_ERROR", {
      jobId,
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("Redis status fetch failed", error);
    return NextResponse.json(
      {
        ok: false,
        mode: "redis",
        jobId,
        status: "failed",
        error: {
          code: "REDIS_STATUS_FAILED",
          message: error instanceof Error ? error.message : "Redis 결과 조회에 실패했습니다.",
          detail: error instanceof Error ? error.stack : String(error),
        },
      } satisfies AnalyzeStatusResponse,
      { status: 500 },
    );
  }
}
