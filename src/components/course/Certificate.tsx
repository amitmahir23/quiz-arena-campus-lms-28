import { forwardRef } from 'react';

interface CertificateProps {
  studentName: string;
  courseName: string;
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ studentName, courseName }, ref) => {
    return (
      <div 
        ref={ref}
        className="flex justify-center items-center min-h-screen bg-[#fdfdfb] p-4"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        <div className="relative bg-white border-8 border-black w-[1000px] h-[700px] p-[60px] text-center box-border before:content-[''] before:absolute before:w-[100px] before:h-[100px] before:border-6 before:border-black before:top-[-6px] before:left-[-6px] before:border-r-0 before:border-b-0 after:content-[''] after:absolute after:w-[100px] after:h-[100px] after:border-6 after:border-black after:bottom-[-6px] after:right-[-6px] after:border-l-0 after:border-t-0">
          <h1 className="text-4xl tracking-[3px] mt-10 mb-10 font-normal">
            CERTIFICATE OF COMPLETION
          </h1>
          
          <p className="italic text-xl mb-12">
            Proudly presented to
          </p>
          
          <p className="text-5xl font-bold my-10 tracking-[3px]">
            {studentName}
          </p>
          
          <p className="text-[22px] my-10">
            For completing the Course – <strong>{courseName}</strong>
          </p>
          
          <p className="mt-20 text-xl text-center">
            Presented by GigaLearn
          </p>
        </div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

export default Certificate;