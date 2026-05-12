import { jsPDF } from "jspdf";
import { getExperienceGroups, getSkillGroups } from "./profileUtils";

// Build fallback initials for the PDF when no embedded profile image is available.
function getProfileInitials(value) {
  const segments = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!segments.length) return "LO";
  return segments.map((s) => s[0]?.toUpperCase() || "").join("");
}

// Flatten whitespace so PDF text layout remains predictable and compact.
function sanitizePdfText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

// jsPDF requires an explicit image format when adding base64 profile images.
function getPdfImageFormat(dataUrl) {
  if (!dataUrl?.startsWith("data:image/")) return null;
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);/);
  const format = match?.[1]?.toUpperCase() || "PNG";
  return format === "JPG" ? "JPEG" : format;
}

// Group badge/module/skill chips into rows that fit the PDF card width.
function buildPdfChipRows(doc, items, maxWidth) {
  const rows = [];
  let currentRow = [];
  let currentWidth = 0;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  items.filter(Boolean).forEach((item) => {
    const label = sanitizePdfText(item);
    if (!label) return;
    const chipWidth = doc.getTextWidth(label) + 20;
    if (currentRow.length && currentWidth + 6 + chipWidth > maxWidth) {
      rows.push(currentRow);
      currentRow = [label];
      currentWidth = chipWidth;
      return;
    }
    currentRow.push(label);
    currentWidth += currentRow.length === 1 ? chipWidth : chipWidth + 6;
  });

  if (currentRow.length) rows.push(currentRow);
  return rows;
}

// Render the profile as a self-contained PDF so export never depends on DOM fetches.
export function exportProfileToPdf(profile, roleLabel, validLinks, fileName) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;
  const contentWidth = pageWidth - margin * 2;
  const cardPadding = 18;
  const bodyFontSize = 10;
  const lineHeight = 14;
  let cursorY = margin;

  const ensureSpace = (h) => {
    if (cursorY + h <= pageHeight - margin) return;
    doc.addPage();
    cursorY = margin;
  };

  const drawCard = (height, fill = [255, 255, 255]) => {
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(...fill);
    doc.roundedRect(margin, cursorY, contentWidth, height, 18, 18, "FD");
  };

  const drawTitle = (title, x, y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(title.toUpperCase(), x, y);
  };

  const drawWrappedText = (text, x, y, width, options = {}) => {
    const lines = doc.splitTextToSize(sanitizePdfText(text), width);
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(options.fontSize || bodyFontSize);
    doc.setTextColor(...(options.color || [71, 85, 105]));
    doc.text(lines, x, y);
    return y + lines.length * (options.lineHeight || lineHeight);
  };

  const drawChips = (rows, x, y, palette = {}) => {
    let endY = y;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    rows.forEach((row, rowIndex) => {
      let chipX = x;
      const chipY = y + rowIndex * 24;
      row.forEach((item) => {
        const chipWidth = doc.getTextWidth(item) + 20;
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(...(palette.fill || [241, 245, 249]));
        doc.roundedRect(chipX, chipY, chipWidth, 18, 9, 9, "FD");
        doc.setTextColor(...(palette.text || [51, 65, 85]));
        doc.text(item, chipX + 10, chipY + 12);
        chipX += chipWidth + 6;
      });
      endY = chipY + 18;
    });
    return endY;
  };

  const addSection = (title, estimatedHeight, drawContent) => {
    ensureSpace(estimatedHeight);
    drawCard(estimatedHeight);
    const x = margin + cardPadding;
    const y = cursorY + 26;
    const width = contentWidth - cardPadding * 2;
    drawTitle(title, x, y);
    drawContent(x, y + 22, width);
    cursorY += estimatedHeight + 14;
  };

  // --- Header card ---
  const name = sanitizePdfText(profile.header.fullName) || "Profile";
  const headline = sanitizePdfText(profile.header.headline) || `${roleLabel} Profile`;
  const meta = [profile.header.major, profile.header.degree, profile.header.expectedGraduation]
    .map(sanitizePdfText)
    .filter(Boolean)
    .join(" | ");
  const email = sanitizePdfText(profile.header.email);
  const summary = sanitizePdfText(profile.header.summary);
  const summaryLines = summary ? doc.splitTextToSize(summary, contentWidth - 170) : [];
  const badgeRows = buildPdfChipRows(doc, profile.badges || [], contentWidth - 170);
  const headerHeight = Math.max(158, 120 + summaryLines.length * 14 + badgeRows.length * 24);

  ensureSpace(headerHeight);
  drawCard(headerHeight, [248, 245, 255]);
  doc.setFillColor(60, 0, 120);
  doc.roundedRect(margin, cursorY, 12, headerHeight, 10, 10, "F");

  const headerX = margin + 26;
  const photoSize = 72;
  const photoX = pageWidth - margin - photoSize - 20;
  const photoY = cursorY + 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(name, headerX, cursorY + 34);

  doc.setFontSize(11);
  doc.setTextColor(60, 0, 120);
  doc.text(headline, headerX, cursorY + 56);

  if (meta) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(meta, headerX, cursorY + 74);
  }
  if (email) doc.text(email, headerX, cursorY + 92);
  if (summaryLines.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(bodyFontSize);
    doc.setTextColor(71, 85, 105);
    doc.text(summaryLines, headerX, cursorY + 116);
  }
  if (badgeRows.length) {
    drawChips(badgeRows, headerX, cursorY + 124 + summaryLines.length * 14, {
      fill: [255, 255, 255],
      text: [60, 0, 120],
    });
  }

  const imageFormat = getPdfImageFormat(profile.header.photoUrl);
  if (imageFormat) {
    try {
      doc.addImage(
        profile.header.photoUrl,
        imageFormat,
        photoX,
        photoY,
        photoSize,
        photoSize,
        undefined,
        "FAST",
      );
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(photoX, photoY, photoSize, photoSize, 18, 18, "S");
    } catch {
      doc.setFillColor(232, 242, 255);
      doc.roundedRect(photoX, photoY, photoSize, photoSize, 18, 18, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(60, 0, 120);
      doc.text(getProfileInitials(name), photoX + 18, photoY + 44);
    }
  } else {
    doc.setFillColor(232, 242, 255);
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 18, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(60, 0, 120);
    doc.text(getProfileInitials(name), photoX + 18, photoY + 44);
  }

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(photoX - 6, photoY + photoSize + 12, 84, 22, 11, 11, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(4, 120, 87);
  doc.text(`${roleLabel} Profile`, photoX + 8, photoY + photoSize + 26);

  cursorY += headerHeight + 16;

  // --- Skills Matrix ---
  const skillGroups = getSkillGroups(profile.skills);
  const skillHeight = skillGroups.reduce((total, group) => {
    const rows = buildPdfChipRows(doc, group.items, contentWidth - cardPadding * 2);
    return total + 26 + Math.max(rows.length, 1) * 24;
  }, 32);

  addSection("Skills Matrix", Math.max(118, skillHeight), (x, y, width) => {
    let localY = y;
    skillGroups.forEach((group) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(group.label, x, localY);
      localY += 12;
      const rows = buildPdfChipRows(doc, group.items, width);
      if (rows.length) {
        localY = drawChips(rows, x, localY + 6) + 18;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodyFontSize);
        doc.setTextColor(148, 163, 184);
        doc.text("No items added.", x, localY + 12);
        localY += 30;
      }
    });
  });

  // --- Featured Projects ---
  const projects = (profile.projects || []).map((p) => ({
    title: sanitizePdfText(p.title) || "Project",
    description: sanitizePdfText(p.description),
    fileName: sanitizePdfText(p.projectFileName),
  }));
  const projectHeight = projects.length
    ? 36 +
      projects.reduce((total, p) => {
        const descLines = p.description
          ? doc.splitTextToSize(p.description, contentWidth - cardPadding * 2 - 24).length
          : 0;
        return total + 38 + descLines * 14 + (p.fileName ? 16 : 0) + 8;
      }, 0)
    : 96;

  addSection("Featured Projects", Math.max(110, projectHeight), (x, y, width) => {
    let localY = y;
    if (!projects.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodyFontSize);
      doc.setTextColor(148, 163, 184);
      doc.text("No projects added yet.", x, localY);
      return;
    }
    projects.forEach((p) => {
      const descLines = p.description ? doc.splitTextToSize(p.description, width - 24) : [];
      const blockHeight = 30 + descLines.length * 14 + (p.fileName ? 16 : 0) + 10;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, localY - 12, width, blockHeight, 12, 12, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(p.title, x + 12, localY + 4);
      let textY = localY + 20;
      if (descLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodyFontSize);
        doc.setTextColor(71, 85, 105);
        doc.text(descLines, x + 12, textY);
        textY += descLines.length * 14;
      }
      if (p.fileName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(p.fileName.toUpperCase(), x + 12, textY + 2);
      }
      localY += blockHeight + 10;
    });
  });

  // --- Academic & Practical Experience ---
  const experienceGroups = getExperienceGroups(profile.experience, roleLabel);
  const experienceHeight = experienceGroups.reduce((total, g) => {
    return total + 24 + Math.max(g.items.length, 1) * 18;
  }, 36);

  addSection(
    "Academic & Practical Experience",
    Math.max(122, experienceHeight),
    (x, y, width) => {
      let localY = y;
      experienceGroups.forEach((group) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(group.label, x, localY);
        localY += 14;
        if (!group.items.length) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(bodyFontSize);
          doc.setTextColor(148, 163, 184);
          doc.text("No items added.", x, localY + 10);
          localY += 28;
          return;
        }
        group.items.forEach((item) => {
          const lines = doc.splitTextToSize(`• ${sanitizePdfText(item)}`, width);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(bodyFontSize);
          doc.setTextColor(71, 85, 105);
          doc.text(lines, x, localY + 10);
          localY += lines.length * 14 + 4;
        });
        localY += 6;
      });
    },
  );

  // --- Education & Links ---
  const moduleRows = buildPdfChipRows(
    doc,
    profile.education.modules || [],
    contentWidth - cardPadding * 2,
  );
  const educationHeight =
    124 + Math.max(moduleRows.length, 0) * 24 + Math.max(validLinks.length, 1) * 16;

  addSection("Education & Links", Math.max(132, educationHeight), (x, y, width) => {
    let localY = y;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Education", x, localY);
    localY += 16;
    localY = drawWrappedText(
      profile.education.institution || "Institution not added",
      x,
      localY,
      width,
    );
    if (profile.education.gpa) {
      localY = drawWrappedText(`GPA: ${profile.education.gpa}`, x, localY + 2, width);
    } else {
      localY += 10;
    }
    if (moduleRows.length) {
      localY = drawChips(moduleRows, x, localY + 6) + 18;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Links", x, localY);
    localY += 16;
    if (!validLinks.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodyFontSize);
      doc.setTextColor(148, 163, 184);
      doc.text("No links added.", x, localY);
      return;
    }
    validLinks.forEach(([label, url]) => {
      localY = drawWrappedText(`${label}: ${url}`, x, localY, width, { lineHeight: 14 }) + 2;
    });
  });

  doc.save(`${fileName}.pdf`);
}
