import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Certificate from './Certificate';
import { Download, Printer } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  courseName: string;
}

const CertificateModal = ({ isOpen, onClose, studentName, courseName }: CertificateModalProps) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && certificateRef.current) {
      const certificateHTML = certificateRef.current.outerHTML;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Certificate - ${courseName}</title>
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${certificateHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = async () => {
    if (certificateRef.current) {
      try {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(certificateRef.current, {
          backgroundColor: '#fdfdfb',
          scale: 2,
          width: 1000,
          height: 700
        });
        
        const link = document.createElement('a');
        link.download = `certificate-${courseName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Error generating certificate image:', error);
        // Fallback to print if html2canvas fails
        handlePrint();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Certificate of Completion</span>
            <div className="flex gap-2">
              <Button 
                onClick={handleDownload}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button 
                onClick={handlePrint}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="scale-75 origin-top">
          <Certificate
            ref={certificateRef}
            studentName={studentName}
            courseName={courseName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;