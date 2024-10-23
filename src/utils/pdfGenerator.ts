import jsPDF from 'jspdf';
import elementsistLogo from '../assets/stylized-logo.png';
import smallLogo from '../assets/black-logo.png';

// Import custom fonts
import { CaslonGradReg } from '../fonts/CaslonGrad-Regular-normal.js';
import { IbarraRealNovaBold } from '../fonts/IbarraRealNova-Bold-bold.js';

interface PdfOptions {
  title: string;
  brandName: string;
  report: string;
}

export const generatePDF = async ({ title, brandName, report }: PdfOptions): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  // Add custom fonts
  pdf.addFileToVFS('CaslonGrad-Regular-normal.ttf', CaslonGradReg);
  pdf.addFileToVFS('IbarraRealNova-Bold-bold.ttf', IbarraRealNovaBold);
  pdf.addFont('CaslonGrad-Regular-normal.ttf', 'CaslonGrad-Regular', 'normal');
  pdf.addFont('IbarraRealNova-Bold-bold.ttf', 'IbarraRealNova-Bold', 'bold');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const usableWidth = pageWidth - 2 * margin;

  // New indentation rules
  const leftjust = 0; // Left-justified text
  const bulletpt1 = 15; // First list item bullet point indent
  const text1 = 35; // First list item text indent
  const bulletpt2 = 40; // Second list item bullet point indent
  const text2 = 60; // Second list item text indent

  // Add logo to first page
  pdf.addImage(elementsistLogo, 'PNG', 0, 0, pageWidth, pageHeight);

  let yPosition = margin;

  const addWrappedText = (
    text: string,
    y: number,
    fontSize: number,
    fontName: string = 'helvetica',
    fontStyle: string = 'normal',
    indent: number = 0,
    listItemIndent: number = 0
  ): number => {
    pdf.setFontSize(fontSize);
    const lineHeight = fontSize * 1.2;
    let currentY = y;
    const maxWidth = usableWidth - indent - listItemIndent;

    const segments = text.split(/(\*\*.*?\*\*)/);
    let isFirstSegment = true;
    let currentLineWidth = 0;
    let currentLine = '';

    const writeCurrentLine = () => {
      if (currentLine) {
        pdf.text(currentLine.trim(), margin + indent + (isFirstSegment ? 0 : listItemIndent), currentY);
        currentY += lineHeight;
        currentLine = '';
        currentLineWidth = 0;
        isFirstSegment = false;
      }
    };

    for (let segment of segments) {
      // let isBold = false;
      let content = segment;

      // Check for bold markers at the beginning and end of the segment
      if (segment.startsWith('**') && segment.endsWith('**')) {
        // isBold = true;
        // fontStyle = 'bold';
        content = segment.slice(2, -2); // Remove ** from the beginning and end
      } else {
        // fontStyle = 'normal';
      }

      // pdf.setFont(isBold ? 'helvetica' : fontName, fontStyle);
      pdf.setFont(fontName, fontStyle);
      const words = content.split(/\s+/);

      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        const word = words[wordIndex];
        const wordWidth = pdf.getTextWidth(word);
        const nextWordWidth = pdf.getTextWidth(' ');
    
        if (currentLineWidth + wordWidth + nextWordWidth > maxWidth) {
          writeCurrentLine();
        }
    
        currentLine += word;
        currentLineWidth += wordWidth;
    
        // Add a space between words but not after the last word
        if (wordIndex < words.length - 1) {
          currentLine += ' ';
          currentLineWidth += nextWordWidth;
        }
    
        if (currentY > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
      }
    }

    writeCurrentLine(); // Write any remaining text

    return currentY;
  };

  const lines = report.split('\n');
  let listType: string | null = null;
  // let listItemCounts: { [key: number]: number } = {};
  let listIndentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFont('helvetica', 'normal');

    if (line.startsWith('# ')) {
      // Section title indented by `leftjust`
      pdf.addPage();
      yPosition = margin + 28;
      yPosition = addWrappedText(line.substring(2), yPosition, 28, 'CaslonGrad-Regular', 'normal', leftjust);
      yPosition += 10;
      listType = null;
      // listItemCounts = {};
      listIndentLevel = 0;
    } else if (line.startsWith('## ')) {
      // Subsection title indented by `leftjust`
      yPosition += 20; // Additional spacing before subheading
      yPosition = addWrappedText(line.substring(3), yPosition, 18, 'CaslonGrad-Regular', 'normal', leftjust);
      yPosition += 8;
      listType = null;
      // listItemCounts = {};
      listIndentLevel = 0;
    } else if (line.startsWith('### ')) {
      // Subsubsection title indented by `leftjust`
      yPosition += 4; // Additional spacing before subheading
      yPosition = addWrappedText(line.substring(3), yPosition, 12, 'CaslonGrad-Regular', 'normal', leftjust);
      yPosition += 0;
      listType = null;
      // listItemCounts = {};
      listIndentLevel = 0;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listType !== 'unordered') {
        listType = 'unordered';
        listIndentLevel++;
      }
      
      const bulletIndent = listIndentLevel === 1 ? bulletpt1 : bulletpt2;
      const textIndent = listIndentLevel === 1 ? text1 : text2;

      // Draw bullet point
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text('•', margin + bulletIndent, yPosition);

      // Draw list item text
      yPosition = addWrappedText(line.substring(2), yPosition, 12, 'helvetica', 'normal', textIndent);
      yPosition += 5; // Add extra spacing after list item

    } else if (line.match(/^\d+\.\s/)) {
      if (listType !== 'ordered') {
        listType = 'ordered';
        listIndentLevel++;
        // listItemCounts[listIndentLevel] = 1; // Correctly initialize ordered list count for new level
      } else {
        // listItemCounts[listIndentLevel]++;
      }

      const bulletIndent = listIndentLevel === 1 ? bulletpt1 : bulletpt2;
      const textIndent = listIndentLevel === 1 ? text1 : text2;

      // Draw numbered list item
      // const numberPrefix = `${listItemCounts[listIndentLevel]}.`;
      let numberPrefix = '0';
      const numberMatch = line.match(/^\d+\.\s/);
      if (numberMatch) {
        numberPrefix = numberMatch[0];
      }

      // Draw the number as the bullet point
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text(numberPrefix, margin + bulletIndent, yPosition);

      // Draw the list item text
      yPosition = addWrappedText(line.substring(line.indexOf('.') + 1).trim(), yPosition, 12, 'helvetica', 'normal', textIndent);
      yPosition += 5; // Add extra spacing after list item

    } else if (line === '') {
      yPosition += 10;
      if (listType) {
        listType = null;
        // listItemCounts = {};
        listIndentLevel = 0;
      }
    } else {
      yPosition = addWrappedText(line, yPosition, 12, 'helvetica');
      yPosition += 5;
    }
  }

  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setFont('CaslonGrad-Regular', 'normal');
    pdf.text(`${i} of ${pageCount}`, margin, pageHeight - margin / 2, { align: 'left' });
    pdf.addImage(smallLogo, 'PNG', pageWidth - 3 * margin, pageHeight - margin, 2 * margin, margin);
  }

  pdf.save('brand_alchemy_report.pdf');
};