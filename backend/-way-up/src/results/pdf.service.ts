import { Injectable, NotFoundException } from '@nestjs/common';
import { ResultsRepository } from './results.repository';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  constructor(private readonly resultsRepo: ResultsRepository) {}

  async generateProfilePdf(
    userId: string,
    resultId: string,
  ): Promise<Buffer> {
    const result = await this.resultsRepo.findOwned(resultId, userId);

    if (!result?.profile) {
      throw new NotFoundException(
        'Wynik lub profil nie został znaleziony do generowania PDF',
      );
    }

    const profile = result.profile as any;
    const archetype = profile.archetype || {};
    const paths = Array.isArray(profile.paths) ? profile.paths : [];
    const skills = profile.skills || {};

    const C = {
      navy: '#101827',
      navyLight: '#1B273A',
      navyPanel: '#202E43',
      gold: '#B99A62',
      goldLight: '#D7C49D',
      ivory: '#F2EFE7',
      ink: '#252F3E',
      muted: '#777D86',
      line: '#D9D2C3',
      white: '#FFFFFF',
    };

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const LEFT = 43;
    const RIGHT = 43;
    const WIDTH = PAGE_WIDTH - LEFT - RIGHT;
    const TOP = 68;
    const BOTTOM = PAGE_HEIGHT - 55;
    const CONTENT_HEIGHT = BOTTOM - TOP;

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: TOP,
          bottom: 55,
          left: LEFT,
          right: RIGHT,
        },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: 'Twój Profil Przyszłości | WayUp AI',
          Author: 'WayUp AI',
          Subject: 'Indywidualny raport kariery',
          Creator: 'WayUp AI',
        },
      });

      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      let regular = 'Helvetica';
      let bold = 'Helvetica-Bold';

      const regularPath = path.join(
        process.cwd(),
        'fonts',
        'Roboto-Regular.ttf',
      );
      const boldPath = path.join(
        process.cwd(),
        'fonts',
        'Roboto-Bold.ttf',
      );

      try {
        if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
          doc.registerFont('Report-Regular', regularPath);
          doc.registerFont('Report-Bold', boldPath);
          regular = 'Report-Regular';
          bold = 'Report-Bold';
        }
      } catch {
        regular = 'Helvetica';
        bold = 'Helvetica-Bold';
      }

      const setFont = (size: number, strong = false) => {
        doc.font(strong ? bold : regular).fontSize(size);
      };

      // Rysowanie w strefie dolnego marginesu (stopki) bez wyzwalania
      // automatycznego dodawania nowej strony przez PDFKit.
      const withoutBottomMargin = (fn: () => void) => {
        const prev = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        try {
          fn();
        } finally {
          doc.page.margins.bottom = prev;
        }
      };

      const measure = (
        value: string,
        size: number,
        width: number,
        strong = false,
        lineGap = 2,
      ) => {
        setFont(size, strong);
        return doc.heightOfString(value, { width, lineGap });
      };

      const formatSalary = (value: unknown) => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return '';
        }

        return value.toLocaleString('pl-PL');
      };

      const drawContentBackground = () => {
        const previousX = doc.x;
        const previousY = doc.y;

        doc.save();

        doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(C.ivory);

        doc.moveTo(0, 0)
          .lineTo(PAGE_WIDTH, 0)
          .lineTo(PAGE_WIDTH, 43)
          .lineTo(LEFT + 200, 43)
          .lineTo(LEFT + 177, 54)
          .lineTo(0, 54)
          .closePath()
          .fill(C.navy);

        doc.moveTo(LEFT + 200, 43)
          .lineTo(LEFT + 177, 54)
          .lineWidth(1)
          .strokeColor(C.gold)
          .stroke();

        setFont(8, true);
        doc.fillColor(C.goldLight).text('WAYUP AI', LEFT, 15);

        setFont(7.5);
        doc.fillColor('#D1D5DD').text(
          'TWÓJ PROFIL PRZYSZŁOŚCI',
          PAGE_WIDTH - RIGHT - 155,
          16,
          { width: 155, align: 'right' },
        );

        doc.restore();

        doc.x = previousX;
        doc.y = previousY;
      };

      doc.on('pageAdded', () => {
        drawContentBackground();
      });

      const addContentPage = () => {
        doc.addPage({
          size: 'A4',
          margins: {
            top: TOP,
            bottom: 55,
            left: LEFT,
            right: RIGHT,
          },
        });

        doc.x = LEFT;
        doc.y = TOP;
      };

      const ensureSpace = (height: number) => {
        if (height <= CONTENT_HEIGHT && doc.y + height > BOTTOM) {
          addContentPage();
        }
      };

      const heading = (title: string, subtitle?: string) => {
        ensureSpace(subtitle ? 43 : 32);

        const y = doc.y;

        doc.moveTo(LEFT, y + 2)
          .lineTo(LEFT + 23, y + 2)
          .lineWidth(1.3)
          .strokeColor(C.gold)
          .stroke();

        setFont(14, true);
        doc.fillColor(C.navy).text(title, LEFT, y + 8, {
          width: WIDTH,
        });

        doc.y = y + 28;

        if (subtitle) {
          setFont(8.2);
          doc.fillColor(C.muted).text(subtitle, LEFT, doc.y, {
            width: WIDTH,
            lineGap: 1,
          });

          doc.y += 5;
        } else {
          doc.y += 1;
        }
      };

      const paragraph = (value: string) => {
        if (!value.trim()) return;

        const height = measure(value, 9, WIDTH, false, 2);

        if (height <= CONTENT_HEIGHT) {
          ensureSpace(height + 8);
        }

        setFont(9);
        doc.fillColor(C.ink).text(value, LEFT, doc.y, {
          width: WIDTH,
          lineGap: 2,
        });

        doc.x = LEFT;
        doc.y += 6;
      };

      const archetypeBlock = () => {
        if (!archetype.name && !archetype.tagline) return;

        const name = String(archetype.name || 'Twój profil');
        const tagline = String(archetype.tagline || '');
        const innerWidth = WIDTH - 36;

        const nameHeight = measure(name, 17, innerWidth, true);
        const taglineHeight = tagline
          ? measure(tagline, 8.5, innerWidth, false, 1)
          : 0;

        const height = Math.max(
          76,
          37 + nameHeight + (tagline ? taglineHeight + 10 : 0),
        );

        ensureSpace(height + 8);

        const x = LEFT;
        const y = doc.y;

        doc.save();

        doc.roundedRect(x, y, WIDTH, height, 4).fill(C.navy);

        doc.moveTo(x + WIDTH - 115, y)
          .lineTo(x + WIDTH, y)
          .lineTo(x + WIDTH, y + height)
          .lineTo(x + WIDTH - 34, y + height)
          .lineTo(x + WIDTH - 59, y + height - 25)
          .closePath()
          .fillOpacity(0.65)
          .fill(C.navyPanel);

        doc.moveTo(x + WIDTH - 34, y + height)
          .lineTo(x + WIDTH - 59, y + height - 25)
          .lineWidth(0.8)
          .strokeColor(C.gold)
          .strokeOpacity(0.7)
          .stroke();

        doc.restore();

        setFont(7.2, true);
        doc.fillColor(C.goldLight).text(
          'TWÓJ ARCHETYP KARIERY',
          x + 18,
          y + 12,
        );

        setFont(17, true);
        doc.fillColor(C.white).text(name, x + 18, y + 28, {
          width: innerWidth,
          lineGap: 1,
        });

        if (tagline) {
          setFont(8.5);
          doc.fillColor('#D8DCE4').text(
            tagline,
            x + 18,
            y + 31 + nameHeight,
            {
              width: innerWidth,
              lineGap: 1,
            },
          );
        }

        doc.x = LEFT;
        doc.y = y + height + 10;
      };

      const careerItem = (item: any, index: number) => {
        const title = String(item.title || 'Ścieżka kariery');
        const description = String(item.description || '');
        const salary = item.salaryPln;

        let salaryText = '';

        if (
          salary &&
          typeof salary === 'object' &&
          salary.min != null &&
          salary.max != null
        ) {
          const min = formatSalary(salary.min);
          const max = formatSalary(salary.max);

          if (min && max) {
            salaryText = `${min} – ${max} PLN brutto`;
          }
        }

        const textX = LEFT + 28;
        const textWidth = WIDTH - 28;
        const titleHeight = measure(title, 9.8, textWidth, true);
        const descriptionHeight = description
          ? measure(description, 8.5, textWidth, false, 1.5)
          : 0;

        const estimatedHeight =
          titleHeight +
          (description ? descriptionHeight + 5 : 0) +
          (salaryText ? 16 : 0) +
          12;

        ensureSpace(
          estimatedHeight <= CONTENT_HEIGHT
            ? estimatedHeight
            : titleHeight + 20,
        );

        const startY = doc.y;

        setFont(8.8, true);
        doc.fillColor(C.gold).text(
          String(index + 1).padStart(2, '0'),
          LEFT,
          startY + 1,
          { width: 21 },
        );

        setFont(9.8, true);
        doc.fillColor(C.navy).text(title, textX, startY, {
          width: textWidth,
          lineGap: 1,
        });

        doc.x = textX;
        doc.y = startY + titleHeight + 3;

        if (description) {
          setFont(8.5);
          doc.fillColor(C.ink).text(description, textX, doc.y, {
            width: textWidth,
            lineGap: 1.5,
          });

          doc.x = textX;
          doc.y += 4;
        }

        if (salaryText) {
          ensureSpace(15);

          setFont(7.8, true);
          doc.fillColor(C.gold).text(
            `WYNAGRODZENIE  ·  ${salaryText}`,
            textX,
            doc.y,
            { width: textWidth },
          );

          doc.x = LEFT;
          doc.y += 9;
        }

        doc.moveTo(textX, doc.y + 2)
          .lineTo(LEFT + WIDTH, doc.y + 2)
          .lineWidth(0.4)
          .strokeColor(C.line)
          .stroke();

        doc.x = LEFT;
        doc.y += 9;
      };

      const skillGroup = (title: string, values: unknown[]) => {
        const items = values.filter(
          (value): value is string =>
            typeof value === 'string' && value.trim().length > 0,
        );

        if (!items.length) return;

        const content = items.join('  ·  ');
        const titleHeight = measure(title, 8.8, WIDTH, true);
        const contentHeight = measure(content, 8.5, WIDTH, false, 2);

        ensureSpace(
          titleHeight + contentHeight + 12 <= CONTENT_HEIGHT
            ? titleHeight + contentHeight + 12
            : titleHeight + 8,
        );

        setFont(8.8, true);
        doc.fillColor(C.navy).text(title, LEFT, doc.y, {
          width: WIDTH,
        });

        doc.y += 3;

        setFont(8.5);
        doc.fillColor(C.ink).text(content, LEFT, doc.y, {
          width: WIDTH,
          lineGap: 2,
        });

        doc.x = LEFT;
        doc.y += 8;
      };

      // ───────────────────────── OKŁADKA ─────────────────────────

      doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(C.navy);

      doc.save();

      doc.moveTo(0, 0)
        .lineTo(PAGE_WIDTH, 0)
        .lineTo(PAGE_WIDTH, 180)
        .lineTo(PAGE_WIDTH - 130, 180)
        .lineTo(PAGE_WIDTH - 205, 110)
        .lineTo(PAGE_WIDTH - 275, 110)
        .lineTo(PAGE_WIDTH - 315, 72)
        .lineTo(0, 72)
        .closePath()
        .fill(C.navyLight);

      doc.moveTo(PAGE_WIDTH - 130, 180)
        .lineTo(PAGE_WIDTH - 205, 110)
        .lineTo(PAGE_WIDTH - 275, 110)
        .lineWidth(0.9)
        .strokeColor(C.gold)
        .strokeOpacity(0.65)
        .stroke();

      doc.moveTo(LEFT, 91)
        .lineTo(LEFT + 48, 91)
        .lineWidth(1.5)
        .strokeColor(C.gold)
        .stroke();

      doc.restore();

      setFont(10, true);
      doc.fillColor(C.goldLight).text('WAYUP AI', LEFT, 63);

      setFont(8);
      doc.fillColor('#D0D5DF').text(
        'INDYWIDUALNY RAPORT KARIERY',
        LEFT,
        118,
      );

      setFont(34, true);
      doc.fillColor(C.ivory).text('Twój Profil', LEFT, 246, {
        width: WIDTH,
      });

      doc.fillColor(C.goldLight).text('Przyszłości', LEFT, 287, {
        width: WIDTH,
      });

      setFont(10.5);
      doc.fillColor('#D0D5DF').text(
        'Poznaj swoje mocne strony.\nOdkryj możliwości. Zaplanuj kolejny krok.',
        LEFT,
        346,
        {
          width: 370,
          lineGap: 6,
        },
      );

      if (archetype.name) {
        const panelY = 465;
        const panelHeight = archetype.tagline ? 103 : 82;

        doc.save();

        doc.moveTo(LEFT, panelY)
          .lineTo(LEFT + WIDTH - 45, panelY)
          .lineTo(LEFT + WIDTH, panelY + 25)
          .lineTo(LEFT + WIDTH, panelY + panelHeight)
          .lineTo(LEFT, panelY + panelHeight)
          .closePath()
          .fill(C.navyPanel);

        doc.moveTo(LEFT, panelY)
          .lineTo(LEFT + WIDTH - 45, panelY)
          .lineTo(LEFT + WIDTH, panelY + 25)
          .lineWidth(0.9)
          .strokeColor(C.gold)
          .stroke();

        doc.restore();

        setFont(7.5, true);
        doc.fillColor(C.goldLight).text(
          'TWÓJ ARCHETYP KARIERY',
          LEFT + 17,
          panelY + 14,
        );

        setFont(19, true);
        doc.fillColor(C.ivory).text(
          String(archetype.name),
          LEFT + 17,
          panelY + 34,
          { width: WIDTH - 34 },
        );

        if (archetype.tagline) {
          setFont(8.8);
          doc.fillColor('#D0D5DF').text(
            String(archetype.tagline),
            LEFT + 17,
            panelY + 64,
            { width: WIDTH - 34 },
          );
        }
      }

      doc.moveTo(LEFT, PAGE_HEIGHT - 76)
        .lineTo(PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 76)
        .lineWidth(0.65)
        .strokeColor('#41495A')
        .stroke();

      // Stopka okładki: w strefie dolnego marginesu, więc bez auto-page-break.
      withoutBottomMargin(() => {
        setFont(8);
        doc.fillColor('#C0C5CF').text(
          'RAPORT INDYWIDUALNY  ·  WAYUP AI',
          LEFT,
          PAGE_HEIGHT - 57,
          { lineBreak: false },
        );
      });

      // ───────────────────────── TREŚĆ ─────────────────────────

      addContentPage();

      heading(
        'Twój profil',
        'Najważniejsze informacje o Twoim potencjale.',
      );

      archetypeBlock();

      if (profile.explanation) {
        heading('Podsumowanie');
        paragraph(String(profile.explanation));
      }

      if (paths.length) {
        heading(
          'Ścieżki kariery',
          'Rekomendowane kierunki rozwoju zawodowego.',
        );

        paths.forEach((item: any, index: number) => {
          careerItem(item, index);
        });
      }

      const hardSkills = Array.isArray(skills.hard) ? skills.hard : [];
      const softSkills = Array.isArray(skills.soft) ? skills.soft : [];

      if (hardSkills.length || softSkills.length) {
        heading(
          'Twoje kompetencje',
          'Umiejętności, które warto rozwijać i wykorzystywać.',
        );

        skillGroup('Umiejętności twarde', hardSkills);
        skillGroup('Umiejętności miękkie', softSkills);
      }

      // ───────────────────── STOPKI I NUMERACJA ─────────────────────

      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;

      for (
        let i = pageRange.start;
        i < pageRange.start + pageRange.count;
        i++
      ) {
        doc.switchToPage(i);

        if (i === 0) continue;

        withoutBottomMargin(() => {
          doc.save();

          doc.moveTo(LEFT, PAGE_HEIGHT - 40)
            .lineTo(PAGE_WIDTH - RIGHT, PAGE_HEIGHT - 40)
            .lineWidth(0.5)
            .strokeColor(C.line)
            .stroke();

          setFont(7.2);
          doc.fillColor(C.muted).text(
            'WAYUP AI  ·  TWÓJ PROFIL PRZYSZŁOŚCI',
            LEFT,
            PAGE_HEIGHT - 28,
            { width: 330, lineBreak: false },
          );

          setFont(7.8, true);
          doc.fillColor(C.gold).text(
            `${i + 1} / ${totalPages}`,
            PAGE_WIDTH - RIGHT - 48,
            PAGE_HEIGHT - 28,
            { width: 48, align: 'right', lineBreak: false },
          );

          doc.restore();
        });
      }

      doc.end();
    });
  }
}