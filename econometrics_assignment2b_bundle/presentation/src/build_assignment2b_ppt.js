const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const { imageSizingContain } = require("./pptxgenjs_helpers/image");
const {
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require("./pptxgenjs_helpers/layout");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_4x3";
pptx.author = "OpenAI Codex";
pptx.company = "XJTLU";
pptx.subject = "ECO214 Assignment 2B";
pptx.title = "Assignment 2B: ADL Model and Information Criteria";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Verdana",
  bodyFontFace: "Verdana",
};

const W = 10;
const H = 7.5;

const COLORS = {
  navy: "333399",
  navyDark: "2D2D8A",
  teal: "BBE0E3",
  tealSoft: "DAEDEF",
  bg: "F7F9FC",
  white: "FFFFFF",
  text: "20242C",
  muted: "5B6571",
  border: "BFC7D3",
  green: "2F7A4D",
  amber: "B46B2C",
  red: "A63D40",
  cardAlt: "EEF3F8",
  codeBg: "F3F6FB",
};

const FONTS = {
  title: "Verdana",
  body: "Verdana",
  code: "Menlo",
};

const SHAPES = {
  line: "line",
  rect: "rect",
  roundRect: "roundRect",
};

const plotPath = path.resolve(__dirname, "..", "assets", "assignment2b_plot.png");
const outputDir = path.resolve(__dirname, "..", "output");
const outputPath = path.resolve(outputDir, "assignment2b_group_presentation.pptx");

const arRows = [
  ["0", "1028.16", "1031.46", "No dynamics"],
  ["1", "863.35", "869.95", "Large improvement"],
  ["2", "860.17", "870.07", "Better fit"],
  [
    "3",
    { text: "842.13", fill: COLORS.tealSoft, bold: true },
    { text: "855.32", fill: COLORS.tealSoft, bold: true },
    { text: "Selected by AIC and BIC", fill: COLORS.tealSoft, bold: true },
  ],
  ["4", "843.94", "860.43", "Extra lag not needed"],
];

const adlBicRows = [
  [{ text: "ADL(3,1)", fill: COLORS.tealSoft, bold: true }, { text: "857.64", fill: COLORS.tealSoft, bold: true }, { text: "Most parsimonious winner", fill: COLORS.tealSoft, bold: true }],
  ["ADL(3,0)", "858.55", "Close second"],
  ["ADL(3,3)", "859.36", "Better fit, but more parameters"],
  ["ADL(3,2)", "860.17", "Still competitive"],
];

const adlAicRows = [
  [{ text: "ADL(3,3)", fill: COLORS.tealSoft, bold: true }, { text: "832.97", fill: COLORS.tealSoft, bold: true }, { text: "Best overall fit", fill: COLORS.tealSoft, bold: true }],
  ["ADL(4,3)", "834.91", "Very close"],
  ["ADL(3,4)", "834.92", "Very close"],
  ["ADL(4,4)", "836.87", "Adds more lags"],
];

const coeffRows = [
  [{ text: "infl_lag1", bold: true }, { text: "0.576", bold: true }, { text: "0.000", bold: true }, { text: "Strong inflation persistence", bold: true }],
  ["infl_lag2", "-0.009", "0.910", "Not significant"],
  [{ text: "infl_lag3", bold: true }, { text: "0.344", bold: true }, { text: "0.000", bold: true }, { text: "Additional persistence at lag 3", bold: true }],
  ["unrate", "-0.654", "0.243", "Current unemployment not significant"],
  ["unrate_lag1", "-1.173", "0.256", "No first-lag effect"],
  [{ text: "unrate_lag2", bold: true }, { text: "3.022", bold: true }, { text: "0.004", bold: true }, { text: "Positive delayed effect", bold: true }],
  [{ text: "unrate_lag3", bold: true }, { text: "-1.330", bold: true }, { text: "0.016", bold: true }, { text: "Negative delayed effect", bold: true }],
];

let slideNo = 0;

function addFooter(slide) {
  slide.addShape(SHAPES.line, {
    x: 0.45,
    y: 7.06,
    w: 9.1,
    h: 0,
    line: { color: COLORS.border, pt: 1 },
  });
  slide.addText("ECO214 | Assignment 2B", {
    x: 0.5,
    y: 7.08,
    w: 3.2,
    h: 0.2,
    fontFace: FONTS.body,
    fontSize: 8.5,
    color: COLORS.muted,
    margin: 0,
  });
  slide.addText(String(slideNo).padStart(2, "0"), {
    x: 9.05,
    y: 7.04,
    w: 0.4,
    h: 0.24,
    fontFace: FONTS.body,
    fontSize: 9,
    bold: true,
    color: COLORS.navy,
    align: "right",
    margin: 0,
  });
}

function addChrome(slide, title, section) {
  slideNo += 1;
  slide.background = { color: COLORS.bg };
  slide.addShape(SHAPES.rect, {
    x: 0,
    y: 0,
    w: W,
    h: 0.58,
    fill: { color: COLORS.navy },
    line: { color: COLORS.navy, pt: 0 },
  });
  slide.addShape(SHAPES.rect, {
    x: 0,
    y: 0.58,
    w: W,
    h: 0.08,
    fill: { color: COLORS.teal },
    line: { color: COLORS.teal, pt: 0 },
  });
  slide.addText(title, {
    x: 0.45,
    y: 0.12,
    w: 6.7,
    h: 0.28,
    fontFace: FONTS.title,
    fontSize: 22,
    bold: true,
    color: COLORS.white,
    margin: 0,
  });
  if (section) {
    slide.addText(section, {
      x: 7.2,
      y: 0.16,
      w: 2.2,
      h: 0.2,
      fontFace: FONTS.body,
      fontSize: 9.5,
      color: COLORS.teal,
      align: "right",
      margin: 0,
    });
  }
  addFooter(slide);
}

function addCard(slide, opts) {
  slide.addShape(SHAPES.roundRect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    fill: { color: opts.fill || COLORS.white },
    line: { color: opts.line || COLORS.border, pt: 1 },
    radius: 0.08,
  });
  if (opts.title) {
    slide.addText(opts.title, {
      x: opts.x + 0.14,
      y: opts.y + 0.1,
      w: opts.w - 0.28,
      h: 0.24,
      fontFace: FONTS.body,
      fontSize: opts.titleSize || 12.5,
      bold: true,
      color: opts.titleColor || COLORS.navy,
      margin: 0,
    });
  }
  if (opts.body) {
    slide.addText(opts.body, {
      x: opts.x + 0.14,
      y: opts.y + (opts.title ? 0.38 : 0.12),
      w: opts.w - 0.28,
      h: opts.h - (opts.title ? 0.48 : 0.2),
      fontFace: opts.fontFace || FONTS.body,
      fontSize: opts.fontSize || 11.2,
      color: opts.bodyColor || COLORS.text,
      valign: "top",
      margin: 0,
      breakLine: false,
    });
  }
}

function addCodeBox(slide, opts) {
  slide.addShape(SHAPES.roundRect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    fill: { color: COLORS.codeBg },
    line: { color: COLORS.border, pt: 1 },
    radius: 0.05,
  });
  if (opts.title) {
    slide.addText(opts.title, {
      x: opts.x + 0.14,
      y: opts.y + 0.08,
      w: opts.w - 0.28,
      h: 0.2,
      fontFace: FONTS.body,
      fontSize: 11,
      bold: true,
      color: COLORS.navy,
      margin: 0,
    });
  }
  slide.addText(opts.code, {
    x: opts.x + 0.14,
    y: opts.y + 0.34,
    w: opts.w - 0.28,
    h: opts.h - 0.42,
    fontFace: FONTS.code,
    fontSize: opts.fontSize || 10.2,
    color: COLORS.text,
    margin: 0,
    valign: "top",
  });
}

function normalizeCell(cell) {
  if (typeof cell === "object" && cell !== null) {
    return {
      text: String(cell.text ?? ""),
      fill: cell.fill,
      color: cell.color,
      bold: cell.bold,
      align: cell.align,
      fontSize: cell.fontSize,
    };
  }
  return { text: String(cell) };
}

function drawTable(slide, opts) {
  const { x, y, headers, rows, colWidths } = opts;
  const rowHeight = opts.rowHeight || 0.4;
  const headerFill = opts.headerFill || COLORS.navy;
  const headerColor = opts.headerColor || COLORS.white;
  const fontSize = opts.fontSize || 10.6;

  let cx = x;
  headers.forEach((header, idx) => {
    slide.addShape(SHAPES.rect, {
      x: cx,
      y,
      w: colWidths[idx],
      h: rowHeight,
      fill: { color: headerFill },
      line: { color: COLORS.white, pt: 0.5 },
    });
    slide.addText(header, {
      x: cx + 0.04,
      y: y + 0.04,
      w: colWidths[idx] - 0.08,
      h: rowHeight - 0.08,
      fontFace: FONTS.body,
      fontSize,
      bold: true,
      color: headerColor,
      align: "center",
      valign: "mid",
      margin: 0,
    });
    cx += colWidths[idx];
  });

  rows.forEach((row, rIdx) => {
    let rx = x;
    row.forEach((cell, cIdx) => {
      const normalized = normalizeCell(cell);
      const fill = normalized.fill || (rIdx % 2 === 0 ? COLORS.white : COLORS.cardAlt);
      slide.addShape(SHAPES.rect, {
        x: rx,
        y: y + rowHeight * (rIdx + 1),
        w: colWidths[cIdx],
        h: rowHeight,
        fill: { color: fill },
        line: { color: COLORS.border, pt: 0.6 },
      });
      slide.addText(normalized.text, {
        x: rx + 0.04,
        y: y + rowHeight * (rIdx + 1) + 0.04,
        w: colWidths[cIdx] - 0.08,
        h: rowHeight - 0.08,
        fontFace: FONTS.body,
        fontSize: normalized.fontSize || fontSize,
        bold: normalized.bold || false,
        color: normalized.color || COLORS.text,
        align: normalized.align || "center",
        valign: "mid",
        margin: 0,
      });
      rx += colWidths[cIdx];
    });
  });
}

function addBullets(slide, items, x, y, w, h, fontSize) {
  slide.addText(
    items.map((item, idx) => ({
      text: item,
      options: {
        bullet: { indent: 12 },
        breakLine: idx < items.length - 1,
      },
    })),
    {
      x,
      y,
      w,
      h,
      fontFace: FONTS.body,
      fontSize: fontSize || 12,
      color: COLORS.text,
      valign: "top",
      margin: 0,
      paraSpaceAfterPt: 9,
    }
  );
}

function finalizeSlide(slide) {
  warnIfSlideHasOverlaps(slide, pptx, { muteContainment: true });
  warnIfSlideElementsOutOfBounds(slide, pptx);
}

function buildDeck() {
  const titleSlide = pptx.addSlide();
  slideNo += 1;
  titleSlide.background = { color: COLORS.bg };
  titleSlide.addShape(SHAPES.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.72,
    fill: { color: COLORS.navy },
    line: { color: COLORS.navy, pt: 0 },
  });
  titleSlide.addShape(SHAPES.rect, {
    x: 0,
    y: 0.72,
    w: 10,
    h: 0.12,
    fill: { color: COLORS.teal },
    line: { color: COLORS.teal, pt: 0 },
  });
  titleSlide.addShape(SHAPES.roundRect, {
    x: 6.55,
    y: 1.25,
    w: 2.55,
    h: 4.3,
    fill: { color: COLORS.tealSoft },
    line: { color: COLORS.tealSoft, pt: 0 },
  });
  titleSlide.addText("ECO214 Group Presentation", {
    x: 0.55,
    y: 1.2,
    w: 5.4,
    h: 0.35,
    fontFace: FONTS.body,
    fontSize: 18,
    bold: true,
    color: COLORS.navy,
    margin: 0,
  });
  titleSlide.addText("Assignment 2B:", {
    x: 0.55,
    y: 1.95,
    w: 4.2,
    h: 0.45,
    fontFace: FONTS.title,
    fontSize: 24,
    bold: true,
    color: COLORS.text,
    margin: 0,
  });
  titleSlide.addText("ADL Model and Information Criteria", {
    x: 0.55,
    y: 2.42,
    w: 5.65,
    h: 0.6,
    fontFace: FONTS.title,
    fontSize: 27,
    bold: true,
    color: COLORS.navyDark,
    margin: 0,
  });
  titleSlide.addText("Inflation forecasting with U.S. quarterly data, 1970Q1-2019Q4", {
    x: 0.55,
    y: 3.2,
    w: 5.6,
    h: 0.45,
    fontFace: FONTS.body,
    fontSize: 13.2,
    color: COLORS.muted,
    margin: 0,
  });
  addCard(titleSlide, {
    x: 6.95,
    y: 1.7,
    w: 1.75,
    h: 0.78,
    fill: COLORS.white,
    title: "Theory",
    titleSize: 16,
    body: "ADL model\nAIC vs BIC\nGranger test",
    fontSize: 10.5,
  });
  addCard(titleSlide, {
    x: 6.95,
    y: 2.72,
    w: 1.75,
    h: 0.78,
    fill: COLORS.white,
    title: "Data",
    titleSize: 16,
    body: "CPIAUCSL\nUNRATE\n1970Q1-2019Q4",
    fontSize: 10.5,
  });
  addCard(titleSlide, {
    x: 6.95,
    y: 3.74,
    w: 1.75,
    h: 0.78,
    fill: COLORS.white,
    title: "Evidence",
    titleSize: 16,
    body: "AR(3)\nADL(3,1)\nADL(3,3)",
    fontSize: 10.5,
  });
  titleSlide.addText("Group members: [Name 1], [Name 2], [Name 3], [Name 4]", {
    x: 0.55,
    y: 5.95,
    w: 5.5,
    h: 0.24,
    fontFace: FONTS.body,
    fontSize: 11.2,
    color: COLORS.text,
    margin: 0,
  });
  titleSlide.addText("Date: [Add your presentation date]", {
    x: 0.55,
    y: 6.25,
    w: 3.2,
    h: 0.2,
    fontFace: FONTS.body,
    fontSize: 10.8,
    color: COLORS.muted,
    margin: 0,
  });
  addFooter(titleSlide);
  finalizeSlide(titleSlide);

  let slide = pptx.addSlide();
  addChrome(slide, "Presentation Content", "Roadmap");
  addCard(slide, {
    x: 0.65,
    y: 1.0,
    w: 4.0,
    h: 1.0,
    fill: COLORS.white,
    title: "1.1 Research question and data",
    body: "What are we forecasting, over which sample, and how is inflation constructed?",
    fontSize: 11,
  });
  addCard(slide, {
    x: 5.0,
    y: 1.0,
    w: 4.0,
    h: 1.0,
    fill: COLORS.white,
    title: "1.2 ADL, AIC/BIC, and Granger causality",
    body: "Why lag selection matters and what the tests mean economically.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 0.65,
    y: 2.25,
    w: 4.0,
    h: 1.0,
    fill: COLORS.white,
    title: "2.1 Stata implementation",
    body: "How we generate variables, estimate models, and compare information criteria.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 5.0,
    y: 2.25,
    w: 4.0,
    h: 1.0,
    fill: COLORS.white,
    title: "2.2 Empirical results",
    body: "AR selection, ADL selection, coefficient interpretation, and Granger test.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 2.8,
    y: 3.6,
    w: 4.0,
    h: 1.0,
    fill: COLORS.tealSoft,
    title: "3.1 Final answers",
    body: "A clear slide that answers parts (a) to (d) directly for the marker.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 0.95,
    y: 5.0,
    w: 8.05,
    h: 1.15,
    fill: COLORS.white,
    title: "Presentation design logic",
    body: "We follow the same strong structure as the previous high-scoring deck: theory first, implementation second, evidence third, and direct assignment answers at the end.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "The Definition of ADL", "Theory");
  addCard(slide, {
    x: 0.7,
    y: 1.0,
    w: 8.55,
    h: 1.15,
    fill: COLORS.white,
    title: "ADL specification",
    body:
      "infl_t = a + sum_{i=1}^p b_i infl_{t-i} + sum_{j=0}^q g_j unrate_{t-j} + u_t\n\nThe model combines inflation persistence with current and lagged unemployment information.",
    fontSize: 13.2,
  });
  addCard(slide, {
    x: 0.8,
    y: 2.5,
    w: 2.55,
    h: 1.55,
    fill: COLORS.tealSoft,
    title: "AR block",
    body: "The lagged inflation terms capture inertia and persistence in price dynamics.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 3.75,
    y: 2.5,
    w: 2.55,
    h: 1.55,
    fill: COLORS.white,
    title: "Distributed lags",
    body: "The unemployment terms let the model test whether labor-market conditions help forecast inflation.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 6.7,
    y: 2.5,
    w: 2.55,
    h: 1.55,
    fill: COLORS.white,
    title: "Assignment link",
    body: "Part (b) selects AR(p).\nPart (c) adds unemployment and selects ADL(p,q).",
    fontSize: 11,
  });
  addCard(slide, {
    x: 1.25,
    y: 4.55,
    w: 7.6,
    h: 1.2,
    fill: COLORS.white,
    title: "Why use ADL here?",
    body: "Inflation is persistent, but the Phillips-curve intuition suggests unemployment may add predictive information with lags. ADL is a natural forecasting framework for that question.",
    fontSize: 11.3,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Interpretation of AIC and BIC", "Theory");
  addCard(slide, {
    x: 0.7,
    y: 1.0,
    w: 4.05,
    h: 1.1,
    fill: COLORS.white,
    title: "AIC",
    body: "AIC = -2 ln(L) + 2k\n\nAIC rewards fit and uses a lighter penalty for extra parameters.",
    fontSize: 13,
  });
  addCard(slide, {
    x: 5.1,
    y: 1.0,
    w: 4.05,
    h: 1.1,
    fill: COLORS.white,
    title: "BIC",
    body: "BIC = -2 ln(L) + k ln(n)\n\nBIC penalizes model size more heavily when n is large.",
    fontSize: 13,
  });
  addCard(slide, {
    x: 0.85,
    y: 2.55,
    w: 2.55,
    h: 1.45,
    fill: COLORS.tealSoft,
    title: "Same sample",
    body: "All candidate models are compared on the same 200-quarter sample.",
    fontSize: 11.1,
  });
  addCard(slide, {
    x: 3.72,
    y: 2.55,
    w: 2.55,
    h: 1.45,
    fill: COLORS.white,
    title: "Penalty gap",
    body: "Here, ln(200) is about 5.30, much larger than the AIC penalty of 2.",
    fontSize: 11.1,
  });
  addCard(slide, {
    x: 6.59,
    y: 2.55,
    w: 2.55,
    h: 1.45,
    fill: COLORS.white,
    title: "Expected outcome",
    body: "AIC usually keeps more lags. BIC usually prefers a smaller model.",
    fontSize: 11.1,
  });
  addCard(slide, {
    x: 1.1,
    y: 4.45,
    w: 7.8,
    h: 1.45,
    fill: COLORS.white,
    title: "How to interpret disagreement",
    body: "If AIC and BIC choose different models, that does not mean one is wrong. It means the fit gain from extra lags is real, but BIC judges that gain too small relative to the added complexity.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Interpretation of Granger Causality", "Theory");
  addCard(slide, {
    x: 0.8,
    y: 1.0,
    w: 8.35,
    h: 1.1,
    fill: COLORS.white,
    title: "Predictive causality, not structural causality",
    body: "In this assignment, unemployment Granger-causes inflation if lagged unemployment improves inflation forecasts after controlling for lagged inflation.",
    fontSize: 12.8,
  });
  addCard(slide, {
    x: 0.95,
    y: 2.5,
    w: 3.9,
    h: 1.55,
    fill: COLORS.tealSoft,
    title: "Null hypothesis",
    body: "H0: gamma_1 = gamma_2 = gamma_3 = 0\n\nThe lagged unemployment terms do not add predictive power.",
    fontSize: 11.4,
  });
  addCard(slide, {
    x: 5.1,
    y: 2.5,
    w: 3.9,
    h: 1.55,
    fill: COLORS.white,
    title: "Decision rule",
    body: "If the joint F-test rejects H0, we conclude that unemployment helps forecast inflation in the ADL(3,3) specification.",
    fontSize: 11.4,
  });
  addCard(slide, {
    x: 1.2,
    y: 4.45,
    w: 7.55,
    h: 1.3,
    fill: COLORS.white,
    title: "Economic meaning",
    body: "The test asks whether labor-market slack contains incremental forecasting information. It does not prove a deep structural Phillips curve by itself, but it is useful evidence for short-run prediction.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Data and Variable Construction", "Empirics");
  drawTable(slide, {
    x: 0.75,
    y: 1.1,
    headers: ["Series", "Role in analysis"],
    rows: [
      ["CPIAUCSL", "Used to construct inflation"],
      ["UNRATE", "Predictor in the ADL model"],
      ["infl_t", "Annualized quarterly inflation rate"],
    ],
    colWidths: [2.2, 5.85],
    rowHeight: 0.48,
    fontSize: 11.2,
  });
  addCard(slide, {
    x: 0.78,
    y: 3.15,
    w: 3.45,
    h: 1.55,
    fill: COLORS.white,
    title: "Inflation formula",
    body: "infl_t = (ln(cpiaucsl_t) - ln(cpiaucsl_{t-1})) * 400",
    fontSize: 12.2,
  });
  addCard(slide, {
    x: 4.48,
    y: 3.15,
    w: 2.05,
    h: 1.55,
    fill: COLORS.tealSoft,
    title: "Sample",
    body: "1970Q1 to 2019Q4\n\n200 quarterly observations",
    fontSize: 11.2,
  });
  addCard(slide, {
    x: 6.8,
    y: 3.15,
    w: 2.15,
    h: 1.55,
    fill: COLORS.white,
    title: "Lag handling",
    body: "Pre-1970 data are used only as initial values for lagged regressors.",
    fontSize: 11.1,
  });
  addCard(slide, {
    x: 0.95,
    y: 5.05,
    w: 8.0,
    h: 0.95,
    fill: COLORS.white,
    title: "Empirical goal",
    body: "Forecast inflation, choose lag lengths with AIC/BIC, and test whether unemployment Granger-causes inflation.",
    fontSize: 11.4,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Stata Implementation", "Workflow");
  addCodeBox(slide, {
    x: 0.68,
    y: 1.05,
    w: 4.1,
    h: 2.55,
    title: "Data preparation",
    code:
      "tsset quarter_date\n" +
      "gen infl = (ln(cpiaucsl) - ln(L.cpiaucsl)) * 400\n" +
      "forvalues i = 1/4 {\n" +
      "    gen infl_lag`i' = L`i'.infl\n" +
      "    gen unrate_lag`i' = L`i'.unrate\n" +
      "}\n" +
      "keep if tin(1970q1, 2019q4)",
  });
  addCodeBox(slide, {
    x: 5.1,
    y: 1.05,
    w: 4.2,
    h: 2.55,
    title: "Model comparison and test",
    code:
      "forvalues p = 0/4 {\n" +
      "    regress infl infl_lag1 ... infl_lag`p'\n" +
      "    estat ic\n" +
      "}\n\n" +
      "regress infl infl_lag1 infl_lag2 infl_lag3 \\\n" +
      "       unrate unrate_lag1 unrate_lag2 unrate_lag3\n" +
      "test unrate_lag1 unrate_lag2 unrate_lag3",
  });
  addCard(slide, {
    x: 0.95,
    y: 4.1,
    w: 8.0,
    h: 1.5,
    fill: COLORS.white,
    title: "Important implementation detail",
    body: "We generate lagged variables before restricting the sample. That keeps the comparison sample fixed at 200 observations, exactly as the assignment instructions require.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Data Overview", "Plots");
  slide.addImage({
    path: plotPath,
    ...imageSizingContain(plotPath, 0.65, 1.0, 6.2, 5.6),
  });
  addCard(slide, {
    x: 7.05,
    y: 1.15,
    w: 2.2,
    h: 1.55,
    fill: COLORS.tealSoft,
    title: "Pattern 1",
    body: "Inflation is high and volatile in the 1970s and early 1980s, then becomes lower and more stable.",
    fontSize: 10.7,
  });
  addCard(slide, {
    x: 7.05,
    y: 2.95,
    w: 2.2,
    h: 1.35,
    fill: COLORS.white,
    title: "Pattern 2",
    body: "Unemployment shows strong business-cycle variation, especially in the early 1980s and after 2008.",
    fontSize: 10.7,
  });
  addCard(slide, {
    x: 7.05,
    y: 4.55,
    w: 2.2,
    h: 1.4,
    fill: COLORS.white,
    title: "Pattern 3",
    body: "The contemporaneous Phillips-curve relationship is not stable; lagged dynamics matter more.",
    fontSize: 10.7,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "AR(p) Model Results", "Part (b)");
  drawTable(slide, {
    x: 0.72,
    y: 1.15,
    headers: ["p", "AIC", "BIC", "Comment"],
    rows: arRows,
    colWidths: [0.8, 1.45, 1.45, 4.8],
    rowHeight: 0.5,
    fontSize: 11.1,
  });
  addCard(slide, {
    x: 0.95,
    y: 4.65,
    w: 3.9,
    h: 1.1,
    fill: COLORS.tealSoft,
    title: "Selected model",
    body: "Both AIC and BIC choose AR(3).",
    fontSize: 13.2,
  });
  addCard(slide, {
    x: 5.1,
    y: 4.65,
    w: 3.85,
    h: 1.1,
    fill: COLORS.white,
    title: "Interpretation",
    body: "Inflation contains substantial serial dependence, and three lags capture most of that persistence.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "ADL(p,q) Model Results", "Part (c)");
  addCard(slide, {
    x: 0.75,
    y: 0.98,
    w: 8.45,
    h: 0.82,
    fill: COLORS.tealSoft,
    title: "Main result",
    body: "BIC selects ADL(3,1), while AIC selects ADL(3,3). This is exactly the pattern we expect when AIC is more willing to keep extra lags.",
    fontSize: 11.1,
  });
  drawTable(slide, {
    x: 0.78,
    y: 2.05,
    headers: ["Best by BIC", "BIC", "Comment"],
    rows: adlBicRows,
    colWidths: [1.35, 1.05, 1.6],
    rowHeight: 0.48,
    fontSize: 10.2,
  });
  drawTable(slide, {
    x: 5.0,
    y: 2.05,
    headers: ["Best by AIC", "AIC", "Comment"],
    rows: adlAicRows,
    colWidths: [1.35, 1.0, 1.75],
    rowHeight: 0.48,
    fontSize: 10.2,
  });
  addCard(slide, {
    x: 0.95,
    y: 4.95,
    w: 8.0,
    h: 1.05,
    fill: COLORS.white,
    title: "Economic interpretation",
    body: "The richer ADL(3,3) improves fit enough for AIC, but BIC judges the extra unemployment lags too expensive relative to its stronger penalty term.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "ADL(3,3) Estimation Results", "Part (d)");
  drawTable(slide, {
    x: 0.72,
    y: 1.05,
    headers: ["Variable", "Coef.", "p-value", "Interpretation"],
    rows: coeffRows,
    colWidths: [1.7, 1.1, 1.2, 4.4],
    rowHeight: 0.48,
    fontSize: 10.6,
  });
  addCard(slide, {
    x: 0.92,
    y: 4.95,
    w: 3.55,
    h: 1.0,
    fill: COLORS.tealSoft,
    title: "Model fit",
    body: "Adj. R-squared = 0.636\nRoot MSE = 1.904",
    fontSize: 11.6,
  });
  addCard(slide, {
    x: 4.72,
    y: 4.95,
    w: 4.2,
    h: 1.0,
    fill: COLORS.white,
    title: "Key message",
    body: "Inflation remains persistent, while unemployment affects inflation with delayed rather than immediate dynamics.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Interpreting ADL(3,3)", "Results");
  addCard(slide, {
    x: 0.82,
    y: 1.1,
    w: 3.85,
    h: 1.4,
    fill: COLORS.tealSoft,
    title: "Inflation persistence",
    body: "infl_lag1 and infl_lag3 are positive and highly significant, which means inflation is not memoryless.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 5.05,
    y: 1.1,
    w: 3.85,
    h: 1.4,
    fill: COLORS.white,
    title: "No immediate unemployment effect",
    body: "The contemporaneous unemployment rate is not significant once lagged inflation is controlled for.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 0.82,
    y: 2.95,
    w: 3.85,
    h: 1.4,
    fill: COLORS.white,
    title: "Delayed transmission",
    body: "unrate_lag2 and unrate_lag3 are significant, so unemployment influences inflation mainly through lags.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 5.05,
    y: 2.95,
    w: 3.85,
    h: 1.4,
    fill: COLORS.white,
    title: "Diagnostics",
    body: "Ljung-Box p-values at lags 4 and 8 are above 0.5, so residual autocorrelation is not an obvious concern.",
    fontSize: 11,
  });
  addCard(slide, {
    x: 1.15,
    y: 4.95,
    w: 7.45,
    h: 0.95,
    fill: COLORS.white,
    title: "Overall interpretation",
    body: "The evidence fits a dynamic, lagged Phillips-curve type story better than a simple contemporaneous trade-off story.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Granger-Causality Test", "Part (d)");
  addCard(slide, {
    x: 0.75,
    y: 1.0,
    w: 8.45,
    h: 0.95,
    fill: COLORS.white,
    title: "Null hypothesis",
    body: "H0: unrate_lag1 = unrate_lag2 = unrate_lag3 = 0",
    fontSize: 13,
  });
  addCard(slide, {
    x: 0.9,
    y: 2.25,
    w: 3.95,
    h: 1.55,
    fill: COLORS.tealSoft,
    title: "Main Granger test",
    body: "F(3,192) = 5.02\np-value = 0.0023\n\nReject H0 at the 1% level.",
    fontSize: 13.2,
  });
  addCard(slide, {
    x: 5.1,
    y: 2.25,
    w: 3.95,
    h: 1.55,
    fill: COLORS.white,
    title: "Joint test with current unrate",
    body: "F(4,192) = 4.30\np-value = 0.0024\n\nThe full unemployment block is jointly significant.",
    fontSize: 12.6,
  });
  addCard(slide, {
    x: 1.1,
    y: 4.35,
    w: 7.75,
    h: 1.35,
    fill: COLORS.white,
    title: "Conclusion",
    body: "Within this linear ADL(3,3) specification and this sample, unemployment Granger-causes inflation because lagged unemployment adds statistically significant forecasting information.",
    fontSize: 11.5,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Why AIC and BIC Disagree", "Interpretation");
  addCard(slide, {
    x: 0.78,
    y: 1.0,
    w: 4.05,
    h: 2.0,
    fill: COLORS.tealSoft,
    title: "AIC lens",
    body: "AIC focuses more on predictive fit. It is willing to keep the extra unemployment lags because ADL(3,3) lowers the objective enough to justify a richer model.",
    fontSize: 11.1,
  });
  addCard(slide, {
    x: 5.12,
    y: 1.0,
    w: 4.05,
    h: 2.0,
    fill: COLORS.white,
    title: "BIC lens",
    body: "BIC punishes complexity more harshly, so it stops at ADL(3,1). The gain from adding more unemployment lags is judged too small relative to the penalty.",
    fontSize: 11.1,
  });
  drawTable(slide, {
    x: 1.35,
    y: 3.45,
    headers: ["Criterion", "Penalty per extra parameter", "Preferred model"],
    rows: [
      ["AIC", "2", "ADL(3,3)"],
      ["BIC", "ln(200) about 5.30", "ADL(3,1)"],
    ],
    colWidths: [1.6, 2.7, 2.35],
    rowHeight: 0.5,
    fontSize: 11,
  });
  addCard(slide, {
    x: 1.05,
    y: 5.15,
    w: 7.9,
    h: 0.9,
    fill: COLORS.white,
    title: "Bottom line",
    body: "Both criteria tell the same broad story: lagged unemployment matters. They simply disagree on how much complexity is worth keeping.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Final Answers to the Assignment", "Summary");
  addCard(slide, {
    x: 0.8,
    y: 1.05,
    w: 4.0,
    h: 1.55,
    fill: COLORS.tealSoft,
    title: "(a) Plot pattern",
    body: "Inflation is high and volatile in the 1970s/early 1980s, then lower and more stable. Unemployment is cyclical, and the contemporaneous relationship is not stable.",
    fontSize: 10.9,
  });
  addCard(slide, {
    x: 5.05,
    y: 1.05,
    w: 4.0,
    h: 1.55,
    fill: COLORS.white,
    title: "(b) AR selection",
    body: "Both AIC and BIC choose AR(3).",
    fontSize: 13.2,
  });
  addCard(slide, {
    x: 0.8,
    y: 2.95,
    w: 4.0,
    h: 1.55,
    fill: COLORS.white,
    title: "(c) ADL selection",
    body: "BIC chooses ADL(3,1), while AIC chooses ADL(3,3). Yes, this is consistent with the idea that AIC tends to choose a more complex model.",
    fontSize: 10.9,
  });
  addCard(slide, {
    x: 5.05,
    y: 2.95,
    w: 4.0,
    h: 1.55,
    fill: COLORS.tealSoft,
    title: "(d) Granger causality",
    body: "Yes. In ADL(3,3), we reject H0 that the lagged unemployment terms are jointly zero.",
    fontSize: 11.8,
  });
  addCard(slide, {
    x: 1.1,
    y: 5.05,
    w: 7.8,
    h: 0.85,
    fill: COLORS.white,
    title: "One-sentence takeaway",
    body: "Inflation is persistent, unemployment adds delayed predictive content, and model selection becomes more conservative under BIC than under AIC.",
    fontSize: 11.2,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Reference List", "References");
  addBullets(
    slide,
    [
      "Akaike, H. (1974) A new look at the statistical model identification.",
      "Schwarz, G. (1978) Estimating the dimension of a model.",
      "Granger, C.W.J. (1969) Investigating causal relations by econometric models and cross-spectral methods.",
      "Stock, J.H. and Watson, M.W. Introductory Econometrics / course materials on dynamic models and forecasting.",
      "FRED data series used in fredgraph.dta: CPIAUCSL and UNRATE.",
    ],
    0.9,
    1.15,
    8.1,
    4.05,
    11.2
  );
  addCard(slide, {
    x: 1.1,
    y: 5.3,
    w: 7.8,
    h: 0.78,
    fill: COLORS.white,
    title: "Note",
    body: "The empirical results in this deck were reproduced in StataSE using the do-file prepared for the assignment.",
    fontSize: 10.9,
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Appendix: Core Stata Code", "Appendix");
  addCodeBox(slide, {
    x: 0.72,
    y: 1.08,
    w: 4.2,
    h: 4.7,
    title: "Lag construction and sample definition",
    fontSize: 10.0,
    code:
      "gen infl = (ln(cpiaucsl) - ln(L.cpiaucsl)) * 400\n" +
      "forvalues i = 1/4 {\n" +
      "    gen infl_lag`i' = L`i'.infl\n" +
      "    gen unrate_lag`i' = L`i'.unrate\n" +
      "}\n" +
      "keep if tin(1970q1, 2019q4)\n\n" +
      "forvalues p = 0/4 {\n" +
      "    regress infl infl_lag1 ... infl_lag`p'\n" +
      "    estat ic\n" +
      "}",
  });
  addCodeBox(slide, {
    x: 5.08,
    y: 1.08,
    w: 4.2,
    h: 4.7,
    title: "ADL estimation and Granger test",
    fontSize: 10.0,
    code:
      "forvalues p = 0/4 {\n" +
      "    forvalues q = 0/4 {\n" +
      "        regress infl infl_lag* unrate unrate_lag*\n" +
      "        estat ic\n" +
      "    }\n" +
      "}\n\n" +
      "regress infl infl_lag1 infl_lag2 infl_lag3 \\\n" +
      "       unrate unrate_lag1 unrate_lag2 unrate_lag3\n" +
      "test unrate_lag1 unrate_lag2 unrate_lag3",
  });
  finalizeSlide(slide);

  slide = pptx.addSlide();
  addChrome(slide, "Thanks", "Closing");
  slide.addShape(SHAPES.roundRect, {
    x: 1.55,
    y: 1.55,
    w: 6.95,
    h: 3.3,
    fill: { color: COLORS.tealSoft },
    line: { color: COLORS.tealSoft, pt: 0 },
  });
  slide.addText("Thank you", {
    x: 2.2,
    y: 2.2,
    w: 5.6,
    h: 0.7,
    fontFace: FONTS.title,
    fontSize: 28,
    bold: true,
    color: COLORS.navyDark,
    align: "center",
    margin: 0,
  });
  slide.addText("Questions and suggestions are welcome.", {
    x: 2.1,
    y: 3.15,
    w: 5.8,
    h: 0.35,
    fontFace: FONTS.body,
    fontSize: 14,
    color: COLORS.text,
    align: "center",
    margin: 0,
  });
  slide.addText("You can replace the placeholders with your group names and date before presenting.", {
    x: 1.95,
    y: 4.0,
    w: 6.15,
    h: 0.35,
    fontFace: FONTS.body,
    fontSize: 10.8,
    color: COLORS.muted,
    align: "center",
    margin: 0,
  });
  finalizeSlide(slide);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  buildDeck();
  await pptx.writeFile({ fileName: outputPath, compression: true });
  console.log(`Wrote ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
