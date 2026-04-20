import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ExternalRedirectProps {
  url: string;
}

const ExternalRedirect = ({ url }: ExternalRedirectProps) => {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    // Ensure URL has protocol
    let redirectUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      redirectUrl = `https://${url}`;
    }
    
    // Small delay to show the page, then redirect
    const timer = setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);

    return () => clearTimeout(timer);
  }, [url]);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center p-8 max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
        <p className="text-slate-600 mb-6">Redirecting to {url}...</p>
        <Button 
          variant="outline" 
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default ExternalRedirect;

