import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
   const location = useLocation();
   const navigate = useNavigate();

   useEffect(() => {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);

      // Auto-redirect to home after 3 seconds
      const timer = setTimeout(() => {
         navigate('/', { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
   }, [location.pathname, navigate]);

   return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
         <div className="text-center p-8">
            <h1 className="mb-4 text-6xl font-bold text-slate-900">404</h1>
            <p className="mb-2 text-xl text-slate-600">Oops! Page not found</p>
            <p className="mb-6 text-sm text-slate-500">
               The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex gap-4 justify-center">
               <Button onClick={() => navigate('/', { replace: true })} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700">
                  Go to Home
               </Button>
               <Button variant="outline" onClick={() => navigate(-1)}>
                  Go Back
               </Button>
            </div>
            <p className="mt-4 text-xs text-slate-400">
               Redirecting to home in 3 seconds...
            </p>
         </div>
      </div>
   );
};

export default NotFound;
