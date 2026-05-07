import PDFDocument from 'pdfkit';

export const generateDeliveryNotePDF = async (note, req, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Configure response stream to be recognized as PDF by the browser
  res.setHeader('Content-Type', 'application/json'); // Changes dinamically to 'application/pdf' when the PDF is generated
  doc.pipe(res);

  // Header: Data of User/Company
  doc.fontSize(20).text('Work Delivery Note', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Company: ${note.company.name}`);
  doc.text(`Technician: ${note.user.name}`);
  doc.text(`Work Date: ${new Date(note.workDate).toLocaleDateString()}`);
  doc.moveDown();

  // Data of Client and Project
  doc.fontSize(14).text('Client Information', { underline: true });
  doc.fontSize(10).text(`Name: ${note.client.name}`);
  doc.text(`CIF: ${note.client.cif}`);
  doc.moveDown(0.5);
  
  doc.fontSize(14).text('Project', { underline: true });
  doc.fontSize(10).text(`Name: ${note.project.name}`);
  doc.text(`Code: ${note.project.projectCode}`);
  doc.moveDown();

  // Data of Delivery Note
  doc.rect(50, doc.y, 500, 20).fill('#eeeeee').stroke();
  doc.fillColor('#000000').text('WORK DESCRIPTION', 60, doc.y - 15);
  doc.moveDown(0.5);
  doc.text(note.description);
  doc.moveDown();

  if (note.format === 'hours') {
    doc.text(`Total Hours: ${note.hours}`);
    if (note.workers && note.workers.length > 0) {
      doc.text('Workers:');
      note.workers.forEach(w => doc.text(`- ${w.name}: ${w.hours}h`));
    }
  } else {
    doc.text(`Material: ${note.material}`);
    doc.text(`Quantity: ${note.quantity} ${note.unit}`);
  }

  // Sign if exists
  if (note.signed && note.signatureUrl) {
    doc.moveDown();
    doc.fontSize(12).text('Signed digitally:', { oblique: true });
    
    try {
      const response = await fetch(note.signatureUrl);
      
      if (!response.ok) throw new Error('Failed to fetch signature image');
      
      // Receive response as ArrayBuffer and convert to Buffer for PDFKit
      const arrayBuffer = await response.arrayBuffer();
      const signatureBuffer = Buffer.from(arrayBuffer);

      // Insert image in PDF
      doc.image(signatureBuffer, {
        fit: [150, 100], 
        align: 'left'
      });
      
      doc.fontSize(8).fillColor('grey').text(`Date of signature: ${new Date(note.signedAt).toLocaleString()}`);
    } catch (error) {
      console.error("Error obtaining signature:", error);
      doc.fontSize(10).fillColor('red').text('Could not load signature image in the document.');
    }
  }

  doc.end();
};