// app/analyze/PdfReport.tsx
// Generates a print-ready HTML document and triggers browser PDF save.

import type { AnalysisResult } from "../api/analyze/route";

const SCORE_LABELS: Record<string, string> = {
  product_clarity: "Product Clarity",
  faq_coverage: "FAQ Coverage",
  trust_signals: "Trust Signals",
  policy_completeness: "Policy Completeness",
  structured_data: "Structured Data",
};

function scoreColor(v: number): string {
  if (v >= 75) return "#10b981";
  if (v >= 50) return "#f97316";
  return "#ef4444";
}

function scoreBarHtml(label: string, value: number): string {
  const color = scoreColor(value);
  return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-size:11px;font-weight:600;color:#475569;">${label}</span>
        <span style="font-size:11px;font-weight:700;color:${color};">${value}/100</span>
      </div>
      <div style="height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
        <div style="height:6px;width:${value}%;background:${color};border-radius:99px;"></div>
      </div>
    </div>`;
}

function severityBadge(s: string): string {
  const map: Record<string, string> = {
    High: "background:#fee2e2;color:#b91c1c;",
    Med: "background:#ffedd5;color:#c2410c;",
    Low: "background:#d1fae5;color:#065f46;",
  };
  return map[s] ?? map["Low"];
}

function priorityBadge(p: string): string {
  const map: Record<string, string> = {
    High: "background:#fee2e2;color:#b91c1c;",
    Medium: "background:#ffedd5;color:#c2410c;",
    Low: "background:#d1fae5;color:#065f46;",
  };
  return map[p] ?? map["Low"];
}

function effortBadge(e: string): string {
  const map: Record<string, string> = {
    Low: "background:#d1fae5;color:#065f46;",
    Medium: "background:#ffedd5;color:#c2410c;",
    High: "background:#fee2e2;color:#b91c1c;",
  };
  return map[e] ?? map["Low"];
}

export function buildPdfHtml(result: AnalysisResult, input: string): string {
  const now = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  const scoreColor_ = scoreColor(result.overall_score);
  const truncatedInput = input.length > 120 ? input.slice(0, 120) + "…" : input;
  const confidenceScore = Math.round(
    (result.score_breakdown.trust_signals +
      result.score_breakdown.policy_completeness +
      result.score_breakdown.structured_data) /
      3
  );
  const confidenceLabel = confidenceScore >= 75 ? "High" : confidenceScore >= 55 ? "Medium" : "Low";
  const confidenceReason =
    result.score_breakdown.structured_data < 50
      ? "Limited structured metadata visibility."
      : result.score_breakdown.policy_completeness < 50
      ? "Incomplete policy coverage."
      : result.score_breakdown.faq_coverage < 50
      ? "Sparse FAQ coverage."
      : "Inputs provide solid coverage.";

  const scoreBreakdownHtml = Object.entries(result.score_breakdown)
    .map(([k, v]) => scoreBarHtml(SCORE_LABELS[k] ?? k, v))
    .join("");

  const topIssuesHtml = result.top_issues
    .map(
      (issue) => `
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <span style="font-size:12px;font-weight:700;color:#1e293b;flex:1;">${issue.title}</span>
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap;${severityBadge(issue.severity)}">${issue.severity}</span>
        </div>
        <p style="font-size:11px;color:#64748b;margin:6px 0 0;line-height:1.6;">${issue.description}</p>
      </div>`
    )
    .join("");


  const actionPlanHtml = result.ranked_action_plan
    .map(
      (rec, i) => `
      <div style="display:flex;gap:12px;border:1px solid #fed7aa;background:#fffaf5;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
        <span style="flex-shrink:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#1e293b;color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;">
            <span style="font-size:12px;font-weight:700;color:#1e293b;">${rec.title}</span>
            <div style="display:flex;gap:4px;">
              <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;${priorityBadge(rec.priority)}">${rec.priority} priority</span>
              <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;${effortBadge(rec.effort)}">${rec.effort} effort</span>
            </div>
          </div>
          <p style="font-size:11px;color:#64748b;margin:5px 0 0;line-height:1.6;">${rec.detail}</p>
        </div>
      </div>`
    )
    .join("");

  const topRecommendationsHtml = result.top_recommendations
    .map(
      (rec, i) => `
      <div style="display:flex;gap:12px;border:1px solid #e2e8f0;background:#ffffff;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
        <span style="flex-shrink:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#1e293b;color:#fff;font-size:11px;font-weight:700;">${i + 1}</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:4px;">
            <span style="font-size:12px;font-weight:700;color:#1e293b;">${rec.title}</span>
            <div style="display:flex;gap:4px;">
              <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;${priorityBadge(rec.priority)}">${rec.priority} priority</span>
              <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;${effortBadge(rec.effort)}">${rec.effort} effort</span>
            </div>
          </div>
          <p style="font-size:11px;color:#64748b;margin:5px 0 0;line-height:1.6;">${rec.detail}</p>
        </div>
      </div>`
    )
    .join("");

  const strengthsHtml = result.perceived_strengths
    .map((s) => `<li style="font-size:11px;color:#1e293b;padding:5px 0;border-bottom:1px solid #f1f5f9;line-height:1.5;">✓ ${s}</li>`)
    .join("");

  const weaknessesHtml = result.perceived_weaknesses
    .map((w) => `<li style="font-size:11px;color:#1e293b;padding:5px 0;border-bottom:1px solid #f1f5f9;line-height:1.5;">✗ ${w}</li>`)
    .join("");

  const gapsHtml = result.comparison.gaps
    .map(
      (gap) => `
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
        <p style="font-size:11px;font-weight:700;color:#ea580c;margin:0 0 8px;">${gap.dimension}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <div style="background:#fff7ed;padding:8px;border-radius:8px;">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px;">AI Perceives</p>
            <p style="font-size:11px;color:#1e293b;margin:0;line-height:1.4;">${gap.ai_perceives}</p>
          </div>
          <div style="background:#f0fdf4;padding:8px;border-radius:8px;">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px;">You Want</p>
            <p style="font-size:11px;color:#1e293b;margin:0;line-height:1.4;">${gap.merchant_intent}</p>
          </div>
          <div style="background:#fafafa;padding:8px;border-radius:8px;">
            <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px;">Gap</p>
            <p style="font-size:11px;color:#1e293b;margin:0;line-height:1.4;">${gap.gap_explanation}</p>
          </div>
        </div>
      </div>`
    )
    .join("");

  const playbookHtml = result.fix_playbook
    .map(
      (step, i) => `
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
        <span style="flex-shrink:0;width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#f97316;color:#fff;font-size:10px;font-weight:700;">${i + 1}</span>
        <p style="font-size:11px;color:#475569;margin:0;line-height:1.6;padding-top:1px;">${step}</p>
      </div>`
    )
    .join("");

  const rewrittenSection =
    result.rewritten_description
      ? `
      <div style="page-break-inside:avoid;">
        <h2 style="font-size:16px;font-weight:800;color:#1e293b;border-bottom:2px solid #fed7aa;padding-bottom:8px;margin:32px 0 16px;">
          ✨ AI-Optimised Rewrite
        </h2>
        <p style="font-size:11px;color:#64748b;margin:0 0 12px;">How your product description should read to score higher with AI shopping agents:</p>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #f97316;border-radius:10px;padding:16px 18px;">
          <p style="font-size:12px;color:#1e293b;margin:0;line-height:1.8;">${result.rewritten_description}</p>
        </div>
      </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Readiness Report — MerchantLens</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #fffaf5;
      color: #1e293b;
      padding: 0;
    }

    .page {
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 52px;
      background: white;
      min-height: 100vh;
    }

    /* ── Cover header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 32px;
      border-bottom: 2px solid #fed7aa;
      margin-bottom: 32px;
    }

    .logo-mark {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f97316;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
      color: white;
    }

    .logo-text {
      line-height: 1.2;
    }

    .logo-kasparro {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: #f97316;
    }

    .logo-sisyphus {
      font-family: 'DM Serif Display', serif;
      font-size: 18px;
      color: #1e293b;
    }

    .report-meta {
      text-align: right;
    }

    .report-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .15em;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .report-date {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      margin-top: 4px;
    }

    /* ── Hero score banner ── */
    .score-banner {
      background: linear-gradient(135deg, #fff7ed 0%, #fffaf5 100%);
      border: 1px solid #fed7aa;
      border-radius: 16px;
      padding: 28px 32px;
      display: flex;
      align-items: center;
      gap: 32px;
      margin-bottom: 28px;
    }

    .score-circle {
      flex-shrink: 0;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      border: 6px solid ${scoreColor_};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .score-number {
      font-family: 'DM Serif Display', serif;
      font-size: 30px;
      color: ${scoreColor_};
      line-height: 1;
    }

    .score-denom {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
    }

    .score-info {
      flex: 1;
    }

    .score-label-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .1em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 99px;
      background: ${scoreColor_}22;
      color: ${scoreColor_};
      margin-bottom: 8px;
    }

    .score-title {
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      color: #1e293b;
      line-height: 1.3;
      margin-bottom: 6px;
    }

    .score-input-preview {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 420px;
    }

    .potential-lift {
      flex-shrink: 0;
      text-align: center;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
    }

    .lift-number {
      font-family: 'DM Serif Display', serif;
      font-size: 26px;
      color: #10b981;
    }

    .lift-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-top: 2px;
    }

    /* ── Section headings ── */
    h2 {
      font-size: 16px;
      font-weight: 800;
      color: #1e293b;
      border-bottom: 2px solid #fed7aa;
      padding-bottom: 8px;
      margin: 32px 0 16px;
    }

    /* ── Two column layout ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 8px;
    }

    .col-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }

    .col-card-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    ul { list-style: none; padding: 0; }

    /* ── AI snapshot ── */
    .snapshot-box {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-left: 4px solid #f97316;
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 28px;
    }

    .snapshot-box p {
      font-size: 12px;
      line-height: 1.75;
      color: #475569;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 20px;
    }

    .meta-pill {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 99px;
      background: #f1f5f9;
      color: #475569;
    }

    .meta-note {
      font-size: 11px;
      color: #64748b;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-left {
      font-size: 10px;
      color: #94a3b8;
    }

    .footer-right {
      font-size: 10px;
      color: #94a3b8;
    }

    /* ── Print ── */
    @media print {
      body { background: white; }
      .page { padding: 32px 40px; box-shadow: none; }
      h2 { page-break-after: avoid; }
      .score-banner, .snapshot-box { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="logo-mark">
        <div class="logo-icon">AI</div>
        <div class="logo-text">
          <div class="logo-kasparro">MerchantLens</div>
          <div class="logo-sisyphus">AI Readiness</div>
        </div>
      </div>
      <div class="report-meta">
        <div class="report-label">AI Readiness Report</div>
        <div class="report-date">${now}</div>
      </div>
    </div>

    <!-- Score Banner -->
    <div class="score-banner">
      <div class="score-circle">
        <span class="score-number">${result.overall_score}</span>
        <span class="score-denom">/100</span>
      </div>
      <div class="score-info">
        <span class="score-label-badge">${result.overall_label}</span>
        <div class="score-title">AI Readiness Score</div>
        <div class="score-input-preview">📝 ${truncatedInput}</div>
      </div>
      <div class="potential-lift">
        <div class="lift-number">${result.potential_lift}</div>
        <div class="lift-label">Potential Lift</div>
      </div>
    </div>

    <!-- Confidence + Methodology -->
    <div class="meta-row">
      <div>
        <span class="meta-pill">Confidence: ${confidenceLabel}</span>
        <span class="meta-note" style="margin-left:8px;">Reason: ${confidenceReason}</span>
      </div>
      <div class="meta-note">Methodology: Product clarity · FAQ coverage · Trust signals · Policy completeness · Structured data</div>
    </div>

    <!-- Score Breakdown -->
    <h2>Score Breakdown</h2>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 22px;">
      ${scoreBreakdownHtml}
    </div>

    <!-- AI Snapshot -->
    <h2>AI Snapshot</h2>
    <div class="snapshot-box">
      <p>${result.ai_snapshot}</p>
    </div>

    <!-- Strengths & Weaknesses -->
    <h2>AI Perception Analysis</h2>
    <div class="two-col">
      <div class="col-card" style="border-color:#bbf7d0;">
        <div class="col-card-title" style="color:#059669;">Perceived Strengths</div>
        <ul>${strengthsHtml}</ul>
      </div>
      <div class="col-card" style="border-color:#fecaca;">
        <div class="col-card-title" style="color:#dc2626;">Perceived Weaknesses</div>
        <ul>${weaknessesHtml}</ul>
      </div>
    </div>

    <!-- Top Issues -->
    <h2>Top Issues</h2>
    ${topIssuesHtml}

    <!-- Top Recommendations -->
    <h2>Top Recommendations</h2>
    ${topRecommendationsHtml}

    <!-- Action Plan -->
    <h2>Action Plan</h2>
    ${actionPlanHtml}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-top:10px;">
      ${playbookHtml}
    </div>

    <!-- Rewritten Description (only for product description mode) -->
    ${rewrittenSection}

    <!-- Gap Analysis -->
    <h2>Perception vs. Intent Gap Analysis</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;">
        <p style="font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">AI Currently Perceives</p>
        <p style="font-size:13px;font-weight:700;color:#1e293b;">${result.comparison.ai_perceives}</p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;">
        <p style="font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:5px;">Merchant Wants to Be Seen As</p>
        <p style="font-size:13px;font-weight:700;color:#1e293b;">${result.comparison.merchant_intent}</p>
      </div>
    </div>
    ${gapsHtml}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">Generated by MerchantLens · AI Readiness Report</div>
      <div class="footer-right">Powered by Groq</div>
    </div>

  </div>
</body>
</html>`;
}

export function downloadPdf(result: AnalysisResult, input: string): void {
  const html = buildPdfHtml(result, input);
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };
}