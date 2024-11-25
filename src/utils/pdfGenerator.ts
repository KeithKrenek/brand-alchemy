import jsPDF from 'jspdf';
import elementsistLogo from '../assets/stylized-logo.png';
import smallLogo from '../assets/black-logo.png';
import pageTwo from '../assets/page-2.png';

// Import custom fonts
import { CaslonGradReg } from '../fonts/CaslonGrad-Regular-normal.js';
import { IbarraRealNovaBold } from '../fonts/IbarraRealNova-Bold-bold.js';

// Heading normalization function to adjust all headings
function normalizeHeadingsLevel(markdown: string): string {
  // Check if the first two characters are "# "
  if (markdown.startsWith('# ')) {
    return markdown; // No changes needed
  }

  // Check if the first two characters are "###"
  if (markdown.startsWith('###')) {
    // Account for possibility of additional heading 1 level because Assistant decided to include a Conclusion
    markdown = markdown.replace(/^### \*\*Conclu/gm, '#### **Conclu');       
    // Reduce "#### " to "## "
    markdown = markdown.replace(/^#### /gm, '## ');
    // Reduce "### " to "# "
    markdown = markdown.replace(/^### /gm, '# ');
    // console.log(markdown)
  }

  // If none of the conditions match, return the original markdown
  return markdown;
}

interface PdfOptions {
  title: string;
  brandName: string;
  report: string;
}

export const generatePDF = async ({ brandName, report }: PdfOptions): Promise<void> => {
  // Normalize the headings in the Markdown content
  const normalizedReport = normalizeHeadingsLevel(report);

  // Create the jsPDF instance
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

  // For adding capitalized subheading beneath main section title
  const mainSections = [
    "The Current Situation",
    "Recommendations",
    "Target Audience",
    "Keywords",
    "The Formula",
    "Proposed Sitemap"
  ];
  const akaMainSections = [
    "WHERE YOU ARE NOW",
    "ALCHEMIZE YOUR VISION",
    "FIND YOUR PEOPLE",
    "TERMS FOR EFFECTIVE MESSAGING + SEO",
    `THE ELIXIR OF ${brandName.toUpperCase()}`,
    "SUGGESTED WEBSITE PAGE HIERARCHY"
  ];

  // New indentation rules
  const leftjust = 0; // Left-justified text
  const bulletpt1 = 15; // First list item bullet point indent
  const text1 = 35; // First list item text indent
  const bulletpt2 = 40; // Second list item bullet point indent
  const text2 = 60; // Second list item text indent

  // Add logo to first page
  pdf.addImage(elementsistLogo, 'PNG', 0, 0, pageWidth, pageHeight);

  // Add brandname to first page
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(29);
  pdf.setTextColor(255, 255, 255);
  const brandNameWidth = pdf.getTextWidth(brandName.toUpperCase());
  const brandNameIndent = (pageWidth - brandNameWidth) / 2;
  pdf.text(brandName.toUpperCase(), brandNameIndent, 3 * pageHeight / 4);
  pdf.setTextColor(0, 0, 0);
  
  // Add second page graphic
  pdf.addPage();
  pdf.addImage(pageTwo, 'PNG', 0, 0, pageWidth, pageHeight);
  // pdf.addPage();

  // All further text additions will use `normalizedReport` instead of `report`
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
      }

      // Set the font based on whether the segment is bold
      // if (isBold) {
      //   pdf.setFont('IbarraRealNova-Bold', 'bold');
      // } else {
        pdf.setFont(fontName, fontStyle);
      // }

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

  const lines = normalizedReport.split('\n');
  let listType: string | null = null;
  // let listItemCounts: { [key: number]: number } = {};
  let listIndentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // console.log(line)

    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFont('helvetica', 'normal');

    if (line.startsWith('# ')) {
      // Section title centered on page
      const titleFontSize = 32;
      pdf.addPage();
      pdf.setFont('CaslonGrad-Regular', 'normal');
      pdf.setFontSize(titleFontSize);
      yPosition = margin + titleFontSize;
      const titleWidth = pdf.getTextWidth(line.substring(2));
      const titleIndent = (pageWidth - titleWidth) / 2;
      pdf.text(line.substring(2), titleIndent, yPosition);
      // yPosition = addWrappedText(line.substring(2), yPosition, 32, 'CaslonGrad-Regular', 'normal', titleIndent);

      // console.log(line.substring(2))
      // console.log(pageWidth)
      // console.log(titleWidth)
      // console.log(titleIndent)
      // console.log(yPosition)
      // let titleLineHeight = titleFontSize * 1.2;
      // yPosition += titleLineHeight;
      yPosition += 10;
      const subTitleFontSize = 16;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(subTitleFontSize);
      yPosition += subTitleFontSize;

      const closestMatchIndex = mainSections.findIndex(mainSections =>
        line.substring(2).toLowerCase().includes(mainSections.toLowerCase())
      );
      const subTitleWidth = pdf.getTextWidth(akaMainSections[closestMatchIndex]);
      const subTitleIndent = (pageWidth - subTitleWidth) / 2;
      pdf.text(akaMainSections[closestMatchIndex], subTitleIndent, yPosition);
      // yPosition = addWrappedText(akaMainSections[closestMatchIndex], yPosition, 16, 'helvetica', 'normal', subTitleIndent);

      yPosition += 20;
      listType = null;
      // listItemCounts = {};
      listIndentLevel = 0;
    } else if (line.startsWith('## ')) {
      // pdf.addPage();
      // yPosition = margin;
      // Subsection title indented by `leftjust`
      yPosition += 20; // Additional spacing before subheading
      yPosition = addWrappedText(line.substring(3), yPosition, 18, 'helvetica', 'normal', leftjust);
      yPosition += 8;
      listType = null;
      // listItemCounts = {};
      listIndentLevel = 0;
    } else if (line.startsWith('### ')) {
      // Subsubsection title indented by `leftjust`
      yPosition += 4; // Additional spacing before subheading
      yPosition = addWrappedText(line.substring(3), yPosition, 12.5, 'helvetica', 'normal', leftjust);
      yPosition += 0;
      listType = null;
      // listItemCounts = {};
      listIndentLevel = 0;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listType !== 'unordered') {
        listType = 'unordered';
        // yPosition += 6;
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
      yPosition += 10; // Add extra spacing after list item

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

  const pageCount = (pdf as any).internal.getNumberOfPages();
  const logoHeight = 0.25 * margin;
  const logoWidth = 2.34 * margin;
  for (let i = 3; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setFont('CaslonGrad-Regular', 'normal');
    pdf.text(`${i} of ${pageCount}`, margin, pageHeight - margin / 2, { align: 'left' });
    pdf.addImage(smallLogo, 'PNG', pageWidth - logoWidth - margin, pageHeight - logoHeight - margin / 2, logoWidth, logoHeight);
  }

  pdf.save('brand_alchemy_report.pdf');
};